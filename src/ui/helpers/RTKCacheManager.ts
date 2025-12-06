/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IDBPDatabase } from "idb";
import { openDB } from "idb";

interface CacheEntry {
  key: string;
  timestamp: number;
  size: number;
  data: unknown;
}

/**
 * RTK Cache Manager - uses IndexedDB for persistent caching
 * Follows the pattern from Vector-Brain frontend for stale-while-revalidate caching
 */
class RTKCacheManager {
  private static readonly CACHE_PREFIX = "rtk-query::";
  public static readonly CACHE_ENABLED = true;
  private static readonly DB_NAME = "vector-agent-rtk-cache";
  private static readonly STORE_NAME = "cache";
  private static readonly MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  private static readonly CACHE_INVALIDATION_STATUS_CODES = [500, 404];
  private static dbPromise: Promise<IDBPDatabase> | null = null;
  private static userCachePrefix: string | null = null;

  private static async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(RTKCacheManager.STORE_NAME)) {
            const store = db.createObjectStore(RTKCacheManager.STORE_NAME, {
              keyPath: "key",
            });
            store.createIndex("timestamp", "timestamp");
          }
        },
      });
    }
    return this.dbPromise;
  }

  private static calculateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  private static async cleanupOldCache(newEntrySize: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.STORE_NAME, "readonly");
      const index = tx.store.index("timestamp");
      const allEntries = await index.getAll();
      await tx.done;

      // Sort by timestamp (oldest first)
      allEntries.sort((a, b) => a.timestamp - b.timestamp);

      let totalSize = allEntries.reduce(
        (sum, entry) => sum + (entry.size || 0),
        0,
      );
      const targetSize = this.MAX_CACHE_SIZE - newEntrySize;

      if (totalSize + newEntrySize <= this.MAX_CACHE_SIZE) {
        return; // No cleanup needed
      }

      const writeTx = db.transaction(this.STORE_NAME, "readwrite");
      for (const entry of allEntries) {
        if (totalSize <= targetSize) break;
        await writeTx.store.delete(entry.key);
        totalSize -= entry.size || 0;
      }
      await writeTx.done;
    } catch (error) {
      console.warn("Failed to cleanup old cache entries", error);
    }
  }

  private static shouldInvalidateCache(statusCode: number): boolean {
    return this.CACHE_INVALIDATION_STATUS_CODES.includes(statusCode);
  }

  static getUserCachePrefix(): string | null {
    return this.userCachePrefix;
  }

  static setUserCachePrefix(prefix: string | null): void {
    this.userCachePrefix = prefix;
  }

  static syncUserCachePrefix(endpointName: string | null, result: any): void {
    // Sync user cache prefix based on profile endpoint response
    if (endpointName === "getProfile" && result?.data?.data?.id) {
      this.setUserCachePrefix(`user-${result.data.data.id}::`);
    }
  }

  static getCacheKey(endpointName: string, args?: unknown): string | null {
    try {
      const serializedArgs = JSON.stringify(args ?? null);
      const userPrefix = this.getUserCachePrefix();
      const prefix = userPrefix ? `${userPrefix}` : "";
      return `${this.CACHE_PREFIX}${prefix}${endpointName}:${serializedArgs}`;
    } catch (error) {
      console.warn(
        `RTK Query cache serialization failed for endpoint "${endpointName}"`,
        error,
      );
      return null;
    }
  }

  static async readCacheEntry(key: string): Promise<CacheEntry | null> {
    if (!key) {
      return null;
    }

    const db = await this.getDB();
    const entry: CacheEntry | undefined = await db.get(this.STORE_NAME, key);

    return entry || null;
  }

  static async writeCacheEntry(key: string, data: unknown): Promise<void> {
    if (!key) {
      return;
    }

    try {
      const size = this.calculateSize(data);

      // Cleanup old entries if needed
      await this.cleanupOldCache(size);

      const db = await this.getDB();
      const entry: CacheEntry = {
        key,
        timestamp: Date.now(),
        size,
        data,
      };

      await db.put(this.STORE_NAME, entry);
    } catch (error) {
      console.warn(`Failed to persist RTK Query cache for key "${key}"`, error);
    }
  }

  static async deleteCacheEntry(key: string): Promise<void> {
    if (!key) {
      return;
    }

    try {
      const db = await this.getDB();
      await db.delete(this.STORE_NAME, key);
    } catch (error) {
      console.warn(`Failed to remove RTK Query cache for key "${key}"`, error);
    }
  }

  static async handleCache({
    rawBaseQuery,
    args,
    api,
    extraOptions,
    baseApi,
    cacheKey,
  }: {
    rawBaseQuery: any;
    args: any;
    api: any;
    extraOptions: any;
    baseApi: any;
    cacheKey: string;
  }): Promise<{
    cachedResponse: {
      data: unknown;
      meta: { size: number; cacheTimestamp: number; source: string };
    } | null;
    networkPromise: Promise<any>;
  }> {
    const cachedEntryPromise = RTKCacheManager.readCacheEntry(cacheKey);

    const networkPromise = rawBaseQuery(args, api, extraOptions)
      .then(async (result: any) => {
        const endpointName =
          typeof api?.endpoint === "string" ? api.endpoint : null;
        RTKCacheManager.syncUserCachePrefix(endpointName, result);

        const errorStatus =
          result?.error?.originalStatus ?? result?.error?.status;
        if (
          typeof errorStatus === "number" &&
          RTKCacheManager.shouldInvalidateCache(errorStatus)
        ) {
          await RTKCacheManager.deleteCacheEntry(cacheKey);
          return result;
        }

        if (result && typeof result === "object" && "data" in result) {
          await RTKCacheManager.writeCacheEntry(cacheKey, result.data);
          // Synchronise RTK Query cache with refreshed data
          const state = api.getState?.();
          const queryCacheKey = api.queryCacheKey;
          const queryState =
            state?.[baseApi.reducerPath]?.queries?.[queryCacheKey];
          if (typeof api.endpoint === "string") {
            const originalArgs = queryState?.originalArgs;
            api.dispatch(
              baseApi.util.upsertQueryData(
                api.endpoint,
                originalArgs,
                result.data,
              ),
            );
          }
        }

        return result;
      })
      .catch(async (error: unknown) => {
        await RTKCacheManager.deleteCacheEntry(cacheKey);
        console.warn(`RTK Query request failed for key "${cacheKey}"`, error);
        throw error;
      });

    const cachedEntry = await cachedEntryPromise;

    if (cachedEntry) {
      return {
        cachedResponse: {
          data: cachedEntry.data,
          meta: {
            size: cachedEntry.size,
            cacheTimestamp: cachedEntry.timestamp,
            source: "indexedDB",
          },
        },
        networkPromise,
      };
    }

    return {
      cachedResponse: null,
      networkPromise,
    };
  }

  static async clearAllCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(this.STORE_NAME, "readwrite");
      await tx.store.clear();
      await tx.done;
    } catch (error) {
      console.warn("Failed to clear all cache entries", error);
    }
  }
}

export default RTKCacheManager;
