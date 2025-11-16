"""Wallet management module for generating and managing Solana wallets."""

import os
from typing import Optional, Dict, Any, Tuple

import base58
from solders.keypair import Keypair

from .wallet_provider_script import PROVIDER_TEMPLATE


class WalletManager:
    """Manages Solana wallet operations"""

    @staticmethod
    def resolve_wallet_credentials(
        wallets: list[Dict[str, Any]],
        active_wallet_id: Optional[str],
        fallback_public_key: Optional[str] = None,
        secret_env_var: Optional[str] = None,
        secret_override: Optional[str] = None,
    ) -> Tuple[Optional[str], Optional[str]]:
        """Resolve active wallet public/secret keys.

        Args:
            wallets: List of wallet dicts from settings.
            active_wallet_id: Currently active wallet id.
            fallback_public_key: Public key coming from CLI/UI override.
            secret_env_var: Name of env var to read secret key from.
            secret_override: Secret key directly provided via CLI.

        Returns:
            Tuple of (public_key, secret_key_b58) when available.
        """

        # Explicit CLI overrides take priority
        secret_key = None
        if secret_env_var:
            secret_key = os.getenv(secret_env_var) or None
        if secret_override:
            secret_key = secret_override

        if fallback_public_key and secret_key:
            return fallback_public_key, secret_key

        if not wallets:
            return (fallback_public_key, secret_key)

        active_wallet = None
        if active_wallet_id:
            active_wallet = next((wallet for wallet in wallets if wallet.get("id") == active_wallet_id), None)
        if not active_wallet:
            active_wallet = next((wallet for wallet in wallets if wallet.get("isActive")), None)
        if not active_wallet:
            active_wallet = wallets[0]

        public_key = active_wallet.get("publicKey") or fallback_public_key
        stored_secret = active_wallet.get("secretKeyEncrypted")
        if stored_secret and not secret_key:
            secret_key = stored_secret

        return public_key, secret_key

    @staticmethod
    def generate_wallet(name: str) -> Dict[str, Any]:
        """
        Generate a new Solana wallet.
        
        Args:
            name: Name for the wallet
            
        Returns:
            Dictionary containing wallet information
        """
        try:
            # Generate new keypair
            keypair = Keypair()
            
            # Get public key and secret key in base58 format
            public_key = str(keypair.pubkey())
            secret_key_b58 = base58.b58encode(bytes(keypair)).decode()
            
            return {
                "success": True,
                "name": name,
                "publicKey": public_key,
                "secretKey": secret_key_b58,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    @staticmethod
    def load_wallet_from_secret(secret_key_b58: str) -> Optional[Keypair]:
        """
        Load a wallet from its base58 secret key.
        
        Args:
            secret_key_b58: Base58 encoded secret key
            
        Returns:
            Keypair object or None if invalid
        """
        try:
            keypair = Keypair.from_bytes(base58.b58decode(secret_key_b58))
            return keypair
        except Exception as e:
            print(f"Error loading wallet: {e}")
            return None

    @staticmethod
    async def get_wallet_balance(public_key: str, rpc_url: str = "https://api.mainnet-beta.solana.com") -> Dict[str, Any]:
        """
        Get the balance of a Solana wallet.
        
        Args:
            public_key: Public key of the wallet
            rpc_url: Solana RPC URL
            
        Returns:
            Dictionary with balance information
        """
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getBalance",
                    "params": [public_key]
                }
                
                async with session.post(rpc_url, json=payload) as response:
                    result = await response.json()
                    
                    if "result" in result:
                        # Balance is in lamports, convert to SOL (1 SOL = 1_000_000_000 lamports)
                        lamports = result["result"]["value"]
                        sol_balance = lamports / 1_000_000_000
                        
                        return {
                            "success": True,
                            "balance": sol_balance,
                            "lamports": lamports,
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("error", {}).get("message", "Unknown error"),
                        }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    @staticmethod
    def make_provider_script(public_key: str, secret_key_b58: str) -> str:
        """Return Phantom-compatible provider script with wallet credentials injected."""

        script = PROVIDER_TEMPLATE.replace("__PUBKEY__", public_key)
        return script.replace("__PRIVKEY__", secret_key_b58)
