from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import P2PKH_scriptPubKey
from ex3a import ex3a_txout_scriptPubKey

amount_to_send = 0.000006
txid_to_spend ='7736852394c791eb54d73ca54f8bd5bdb4afa77df60c771b0d44e5e2f441bcd6'
utxo_index = 0

txin_scriptPubKey = ex3a_txout_scriptPubKey

txin_scriptSig = [1196,1016]

txout_scriptPubKey = P2PKH_scriptPubKey(faucet_address)

response = send_from_custom_transaction(
    amount_to_send, txid_to_spend, utxo_index,
    txin_scriptPubKey, txin_scriptSig, txout_scriptPubKey)
print(response.status_code, response.reason)
print(response.text)