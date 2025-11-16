from solders.keypair import Keypair
import base58

wallet = Keypair()

print("Address  :", wallet.pubkey())
print("Secret   :", base58.b58encode(bytes(wallet)).decode())