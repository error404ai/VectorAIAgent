/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Global from "../config/global";
import { authHeader } from "../helpers/auth-header";
import authManager from "../helpers/authManager";
import RefreshTokenManager from "../helpers/refreshTokenManager";
import RTKCacheManager from "../helpers/RTKCacheManager";

export const TAGS = {
  ACCOUNT_INFO: "accountInfo",
  PROFILE: "Profile",
  USER: "User",
} as const;

const baseQuery = async (args: any, api: any, extraOptions: any) => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: Global.BASE_API_PATH,
    credentials: "include",
    prepareHeaders: (headers) => {
      const authHeaders = authHeader(false);
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, String(value));
      });
      return headers;
    },
  });

  const cacheKey = RTKCacheManager.getCacheKey(api?.endpoint, args);
  const shouldCache = (): boolean => {
    const cacheEnabled = RTKCacheManager.CACHE_ENABLED;
    const isQuery = api?.type === "query";
    const hasCacheKey = Boolean(cacheKey);
    return cacheEnabled && isQuery && hasCacheKey;
  };

  const executeWithRefresh = async (
    requestArgs: any,
    requestApi: any,
    requestExtraOptions: any,
  ) => {
    const result = await RefreshTokenManager.execute({
      requestArgs,
      api: requestApi,
      extraOptions: requestExtraOptions,
      baseQueryFn: rawBaseQuery,
    });

    const endpointName =
      typeof requestApi?.endpoint === "string" ? requestApi.endpoint : null;
    RTKCacheManager.syncUserCachePrefix(endpointName, result);

    await authManager.handleApiError(result, requestApi);
    return result;
  };

  if (shouldCache() && cacheKey) {
    const { cachedResponse, networkPromise } =
      await RTKCacheManager.handleCache({
        rawBaseQuery: executeWithRefresh,
        args,
        api,
        extraOptions,
        baseApi,
        cacheKey,
      });

    if (cachedResponse) {
      // Avoid unhandled rejections while background refresh syncs the cache
      networkPromise.catch(() => {});
      return cachedResponse;
    }

    return networkPromise;
  }

  // No cache or not cacheable - fetch normally
  return executeWithRefresh(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: Object.values(TAGS),
  endpoints: () => ({}),
});
