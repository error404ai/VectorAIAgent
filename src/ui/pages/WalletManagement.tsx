import {
  Copy,
  Plus,
  RefreshCw,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Window } from "../../../types/global-types";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageTitle from "../components/PageTitle";
import { useWalletStore, type SolanaWallet } from "../stores/WalletStore";

declare const window: Window;

function WalletManagement() {
  const {
    wallets,
    isLoading,
    error,
    isGenerating,
    updatingBalanceIds,
    setWallets,
    setIsLoading,
    setError,
    setIsGenerating,
    addUpdatingBalanceId,
    removeUpdatingBalanceId,
  } = useWalletStore();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);

  // Load wallets
  const loadWallets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await (
        window as unknown as Window
      ).electronAPI.getWallets();
      if (result.success && result.wallets) {
        setWallets(result.wallets);
      } else {
        setError(result.message || "Failed to load wallets");
      }
    } catch (err) {
      console.error("Failed to load wallets:", err);
      setError("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  }, [setWallets, setIsLoading, setError]);

  // Initial load
  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // Generate new wallet
  const handleGenerateWallet = async () => {
    if (!newWalletName.trim()) {
      setGenerateError("Please enter a wallet name");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const result = await window.electronAPI.generateWallet(
        newWalletName.trim(),
      );

      if (result.success) {
        setShowGenerateModal(false);
        setNewWalletName("");
        await loadWallets(); // Reload wallets
      } else {
        setGenerateError(result.message || "Failed to generate wallet");
      }
    } catch (err) {
      console.error("Failed to generate wallet:", err);
      setGenerateError("Failed to generate wallet");
    } finally {
      setIsGenerating(false);
    }
  };

  // Update wallet balance
  const handleUpdateBalance = async (walletId: string) => {
    addUpdatingBalanceId(walletId);

    try {
      const result = await window.electronAPI.updateWalletBalance(walletId);

      if (result.success) {
        await loadWallets(); // Reload to get updated balance
      } else {
        console.error("Failed to update balance:", result.message);
      }
    } catch (err) {
      console.error("Failed to update balance:", err);
    } finally {
      removeUpdatingBalanceId(walletId);
    }
  };

  // Delete wallet
  const handleDeleteWallet = async (wallet: SolanaWallet) => {
    if (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !(window as unknown as any).confirm(
        `Are you sure you want to delete wallet "${wallet.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteWallet(wallet.id);

      if (result.success) {
        await loadWallets(); // Reload wallets
      } else {
        alert(result.message || "Failed to delete wallet");
      }
    } catch (err) {
      console.error("Failed to delete wallet:", err);
      alert("Failed to delete wallet");
    }
  };

  // Set active wallet
  const handleSetActiveWallet = async (walletId: string) => {
    try {
      const result = await window.electronAPI.setActiveWallet(walletId);

      if (result.success) {
        await loadWallets(); // Reload to update active status
      } else {
        alert(result.message || "Failed to set active wallet");
      }
    } catch (err) {
      console.error("Failed to set active wallet:", err);
      alert("Failed to set active wallet");
    }
  };

  // Copy to clipboard
  const handleCopy = (
    text: string,
    walletId: string,
    field: "public" | "secret",
  ) => {
    navigator.clipboard.writeText(text);
    const compositeId = `${walletId}-${field}`;
    setCopiedFieldId(compositeId);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col select-none">
      <div className="flex-shrink-0">
        <PageTitle title="Wallet Management">
          <Button
            onClick={() => {
              setShowGenerateModal(true);
              setGenerateError(null);
              setNewWalletName("");
            }}
          >
            <Plus size={16} />
            <span>Generate Wallet</span>
          </Button>
        </PageTitle>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {error && (
          <div className="mb-4 border border-red-500 bg-red-500/20 px-4 py-2 text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60">Loading wallets...</div>
          </div>
        ) : wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <WalletIcon size={48} className="mb-4 text-white/20" />
            <p className="mb-4 text-white/60">No wallets yet</p>
            <Button
              onClick={() => {
                setShowGenerateModal(true);
                setGenerateError(null);
                setNewWalletName("");
              }}
            >
              <Plus size={16} />
              <span>Generate Your First Wallet</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {wallets.map((wallet) => (
              <Card key={wallet.id}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <WalletIcon
                        size={20}
                        className="flex-shrink-0 text-blue-400"
                      />
                      <h3 className="truncate text-lg font-medium text-white">
                        {wallet.name}
                      </h3>
                      {wallet.isActive && (
                        <span className="border border-green-500 bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-24 flex-shrink-0 text-white/60">
                          Public Key:
                        </span>
                        <code className="flex-1 truncate bg-black/30 px-2 py-1 text-white/80">
                          {wallet.publicKey}
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(wallet.publicKey, wallet.id, "public")
                          }
                          className="p-1 transition-colors hover:bg-white/10"
                          title="Copy public key"
                        >
                          <Copy
                            size={16}
                            className={
                              copiedFieldId === `${wallet.id}-public`
                                ? "text-green-400"
                                : "text-white/60"
                            }
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-24 flex-shrink-0 text-white/60">
                          Private Key:
                        </span>
                        <code className="flex-1 truncate bg-black/30 px-2 py-1 text-white/80">
                          {wallet.secretKeyEncrypted}
                        </code>
                        <button
                          onClick={() =>
                            handleCopy(
                              wallet.secretKeyEncrypted,
                              wallet.id,
                              "secret",
                            )
                          }
                          className="p-1 transition-colors hover:bg-white/10"
                          title="Copy private key"
                        >
                          <Copy
                            size={16}
                            className={
                              copiedFieldId === `${wallet.id}-secret`
                                ? "text-green-400"
                                : "text-white/60"
                            }
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-24 flex-shrink-0 text-white/60">
                          Balance:
                        </span>
                        <span className="font-mono text-white">
                          {wallet.balance.toFixed(4)} SOL
                        </span>
                        <button
                          onClick={() => handleUpdateBalance(wallet.id)}
                          disabled={updatingBalanceIds.has(wallet.id)}
                          className="p-1 transition-colors hover:bg-white/10 disabled:opacity-50"
                          title="Refresh balance"
                        >
                          <RefreshCw
                            size={16}
                            className={`text-white/60 ${updatingBalanceIds.has(wallet.id) ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-24 flex-shrink-0 text-white/60">
                          Created:
                        </span>
                        <span className="text-white/60">
                          {new Date(wallet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    {!wallet.isActive && (
                      <button
                        onClick={() => handleSetActiveWallet(wallet.id)}
                        className="border border-blue-500 px-3 py-1 text-sm text-blue-400 transition-colors hover:bg-blue-500/20"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteWallet(wallet)}
                      className="p-2 text-red-400 transition-colors hover:bg-red-500/20"
                      title="Delete wallet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Wallet Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => !isGenerating && setShowGenerateModal(false)}
        title="Generate New Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/80">
              Wallet Name
            </label>
            <Input
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="Enter wallet name (e.g., My Main Wallet)"
              disabled={isGenerating}
            />
          </div>

          {generateError && (
            <div className="border border-red-500 bg-red-500/20 px-3 py-2 text-sm text-red-400">
              {generateError}
            </div>
          )}

          <div className="border border-yellow-500 bg-yellow-500/20 px-3 py-2 text-sm text-yellow-400">
            <p className="mb-1 font-medium">⚠️ Important:</p>
            <p className="text-xs">
              Your wallet's private key will be securely stored. Make sure to
              back up your settings file. Never share your private key with
              anyone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowGenerateModal(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateWallet}
              disabled={isGenerating || !newWalletName.trim()}
            >
              {isGenerating ? "Generating..." : "Generate Wallet"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default WalletManagement;
