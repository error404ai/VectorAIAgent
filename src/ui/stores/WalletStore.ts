// src/ui/stores/WalletStore.ts

import { create } from "zustand";

export interface SolanaWallet {
  id: string;
  name: string;
  publicKey: string;
  secretKeyEncrypted: string;
  balance: number;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WalletStore {
  wallets: SolanaWallet[];
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  isUpdatingBalance: boolean;
  updatingBalanceIds: Set<string>;

  // Actions
  setWallets: (wallets: SolanaWallet[]) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsUpdatingBalance: (updating: boolean) => void;
  addUpdatingBalanceId: (id: string) => void;
  removeUpdatingBalanceId: (id: string) => void;

  // Computed
  getWalletForProfile: (profileId: string) => SolanaWallet | undefined;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  isLoading: false,
  error: null,
  isGenerating: false,
  isUpdatingBalance: false,
  updatingBalanceIds: new Set<string>(),

  setWallets: (wallets) => set({ wallets }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setIsUpdatingBalance: (updating) => set({ isUpdatingBalance: updating }),
  addUpdatingBalanceId: (id) =>
    set((state) => ({
      updatingBalanceIds: new Set([...state.updatingBalanceIds, id]),
    })),
  removeUpdatingBalanceId: (id) =>
    set((state) => {
      const newSet = new Set(state.updatingBalanceIds);
      newSet.delete(id);
      return { updatingBalanceIds: newSet };
    }),

  getWalletForProfile: (profileId: string) => {
    const { wallets } = get();
    return wallets.find((w) => w.profileId === profileId);
  },
}));
