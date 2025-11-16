// src/electron/services/WalletService.ts

import SettingsFileManager from "./SettingsFileManager.js";

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

export interface WalletSettings {
  wallets: SolanaWallet[];
  activeWalletId?: string;
}

class WalletService {
  async getWallets(): Promise<SolanaWallet[]> {
    return SettingsFileManager.getWalletSettings().wallets;
  }

  async getActiveWallet(): Promise<SolanaWallet | null> {
    const settings = SettingsFileManager.getWalletSettings();
    if (!settings.activeWalletId) return null;

    return (
      settings.wallets.find((w) => w.id === settings.activeWalletId) || null
    );
  }

  async addWallet(
    wallet: Omit<SolanaWallet, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ success: boolean; wallet?: SolanaWallet; message?: string }> {
    try {
      const settings = SettingsFileManager.getWalletSettings();

      // Check if wallet with same name or public key exists
      const existingWallet = settings.wallets.find(
        (w) => w.name === wallet.name || w.publicKey === wallet.publicKey,
      );

      if (existingWallet) {
        return {
          success: false,
          message: "Wallet with this name or public key already exists",
        };
      }

      const now = new Date().toISOString();
      const newWallet: SolanaWallet = {
        ...wallet,
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      settings.wallets.push(newWallet);

      // If this is the first wallet, make it active
      if (settings.wallets.length === 1) {
        settings.activeWalletId = newWallet.id;
      }

      SettingsFileManager.saveWalletSettings(settings);

      return { success: true, wallet: newWallet };
    } catch (error) {
      console.error("Error adding wallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateWallet(
    walletId: string,
    updates: Partial<Omit<SolanaWallet, "id" | "createdAt">>,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getWalletSettings();
      const walletIndex = settings.wallets.findIndex((w) => w.id === walletId);

      if (walletIndex === -1) {
        return { success: false, message: "Wallet not found" };
      }

      settings.wallets[walletIndex] = {
        ...settings.wallets[walletIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      SettingsFileManager.saveWalletSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error updating wallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteWallet(
    walletId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getWalletSettings();
      const walletIndex = settings.wallets.findIndex((w) => w.id === walletId);

      if (walletIndex === -1) {
        return { success: false, message: "Wallet not found" };
      }

      settings.wallets.splice(walletIndex, 1);

      // If deleted wallet was active, set another wallet as active
      if (settings.activeWalletId === walletId) {
        settings.activeWalletId =
          settings.wallets.length > 0 ? settings.wallets[0].id : undefined;
      }

      SettingsFileManager.saveWalletSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error deleting wallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async setActiveWallet(
    walletId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const settings = SettingsFileManager.getWalletSettings();
      const wallet = settings.wallets.find((w) => w.id === walletId);

      if (!wallet) {
        return { success: false, message: "Wallet not found" };
      }

      // Update all wallets' isActive status
      settings.wallets = settings.wallets.map((w) => ({
        ...w,
        isActive: w.id === walletId,
      }));

      settings.activeWalletId = walletId;

      SettingsFileManager.saveWalletSettings(settings);

      return { success: true };
    } catch (error) {
      console.error("Error setting active wallet:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default new WalletService();
