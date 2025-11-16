// src/ui/stores/WalletStore.ts

import { create } from "zustand";

export interface SolanaWallet {
  id: string;
  name: string;
  publicKey: string;
  secretKeyEncrypted: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WalletStore {
  wallets: SolanaWallet[];
  activeWalletId?: string;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  isUpdatingBalance: boolean;
  updatingBalanceIds: Set<string>;

  // Actions
  setWallets: (wallets: SolanaWallet[]) => void;
  setActiveWalletId: (id?: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsUpdatingBalance: (updating: boolean) => void;
  addUpdatingBalanceId: (id: string) => void;
  removeUpdatingBalanceId: (id: string) => void;

  // Computed
  getActiveWallet: () => SolanaWallet | undefined;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  activeWalletId: undefined,
  isLoading: false,
  error: null,
  isGenerating: false,
  isUpdatingBalance: false,
  updatingBalanceIds: new Set<string>(),

  setWallets: (wallets) => set({ wallets }),
  setActiveWalletId: (id) => set({ activeWalletId: id }),
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

  getActiveWallet: () => {
    const { wallets, activeWalletId } = get();
    return wallets.find((w) => w.id === activeWalletId);
  },
}));
