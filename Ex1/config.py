from bitcoin import SelectParams
from bitcoin.base58 import decode
from bitcoin.wallet import CBitcoinAddress, CBitcoinSecret, P2PKHBitcoinAddress


SelectParams('testnet')

# TODO: Fill this in with your private key.
my_private_key = CBitcoinSecret(
    'cPa3BdrDrts8oa1Mx6Znks3bqw5LCq2ERd7o3tL9BEM9QCZhYhq1')
my_public_key = my_private_key.pub
my_address = P2PKHBitcoinAddress.from_pubkey(my_public_key)

faucet_address = CBitcoinAddress('mtwbVPqjX8m7gWNzbok3MVmE9VPn6zUWgy')
