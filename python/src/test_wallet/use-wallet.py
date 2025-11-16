from solana.rpc.api import Client
from solders.keypair import Keypair
import base58

# Address  : 31LTa1aVpYjiuYr1ZKb5KxNHVECPhQkVzVmdiS9nWah7
# Secret   : 4JLKdnyMtTs5TWpWE5my55Hysoqj3MsgrMZLWtqRsTfm6Ey65umddq55D97MU43oTSJt1LhEBQMdZ7jd88kKTFVs

SECRET_B58 = "4JLKdnyMtTs5TWpWE5my55Hysoqj3MsgrMZLWtqRsTfm6Ey65umddq55D97MU43oTSJt1LhEBQMdZ7jd88kKTFVs"
wallet = Keypair.from_bytes(base58.b58decode(SECRET_B58))
pubkey = wallet.pubkey()

client = Client("https://api.mainnet-beta.solana.com")
balance = client.get_balance(pubkey).value
print("Balance:", balance / 1e9, "SOL")