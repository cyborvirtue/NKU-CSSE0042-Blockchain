from sys import exit
from bitcoin.core.script import *

from utils import *
from config import my_private_key, my_public_key, my_address, faucet_address
from ex1 import send_from_P2PKH_transaction

######################################################################
# TODO: Complete the scriptPubKey implementation for Exercise 3
ex3a_txout_scriptPubKey = [
    OP_2DUP,
    OP_ADD,
    2212,
    OP_EQUALVERIFY,
    OP_SUB,
    180,
    OP_EQUAL
]
######################################################################

if __name__ == '__main__':
    ######################################################################
    # Set the transaction parameters
    amount_to_send = 0.00001   # Total BTC amount to send (includes fee)
    fee = 0.000001             # Transaction fee amount

    txid_to_spend = (
        '3bd6d7c4a0f1300932e63f0d8ffa8e4642b88884a70bdfc02f36988be2eaa32f')
    utxo_index = 4
    ######################################################################

    # Send transaction with fee
    response = send_from_P2PKH_transaction(
        amount_to_send, txid_to_spend, utxo_index,
        ex3a_txout_scriptPubKey)
    print(response.status_code, response.reason)
    print(response.text)
