from sys import exit
from bitcoin.core.script import *
from bitcoin.wallet import CBitcoinSecret
from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction

cust1_private_key = CBitcoinSecret(
    'cMcj6JgmexbN8J6Bcr7v9bFpYup9XQFScGTbV6bBJNvxDrXdM89o')
cust1_public_key = cust1_private_key.pub
cust2_private_key = CBitcoinSecret(
    'cRYB9hHCYRAsTiZXprucvjJSrjnCPMaz4H7u3DcgBfnSCSo8ET1h')
cust2_public_key = cust2_private_key.pub
cust3_private_key = CBitcoinSecret(
    'cPRtsfQbefreFe2cCos8SJZZoYKUedqgpbtH8QgSALHKTfea8jVX')
cust3_public_key = cust3_private_key.pub


######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 2

# You can assume the role of the bank for the purposes of this problem
# and use my_public_key and my_private_key in lieu of bank_public_key and
# bank_private_key.

required_signatures = 3
public_key=[
    cust1_public_key,
    cust2_public_key,
    cust3_public_key
]

ex2a_txout_scriptPubKey = CScript([required_signatures] + public_key + [len(public_key), OP_CHECKMULTISIG])
######################################################################

if __name__ == '__main__':
    ######################################################################
    # TODO: set these parameters correctly
    amount_to_send = 0.00001
    txid_to_spend = (
        '01c85c3b767cb238281fcfa726b472712510b1e50d9bc9983066cf160ab1109e')
    utxo_index = 0
    ######################################################################

    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex2a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)
