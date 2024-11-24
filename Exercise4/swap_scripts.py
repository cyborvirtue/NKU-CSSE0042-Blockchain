from bitcoin.core.script import *

######################################################################
# This function will be used by Alice and Bob to send their respective
# coins to a utxo that is redeemable either of two cases:
# 1) Recipient provides x such that hash(x) = hash of secret 
#    and recipient signs the transaction.
# 2) Sender and recipient both sign transaction
# 
# TODO: Fill this in to create a script that is redeemable by both
#       of the above conditions.
# 
# See this page for opcode: https://en.bitcoin.it/wiki/Script
#
#

# This is the ScriptPubKey for the swap transaction
def coinExchangeScript(public_key_sender, public_key_recipient, hash_of_secret):
    return [
        # 需要接收者的签名来兑现
        public_key_recipient,
        OP_CHECKSIGVERIFY,
        # 检查发送者签名
        OP_IF,
        public_key_sender,
        OP_CHECKSIG,
        # 检查 hash_of_secret
        OP_ELSE,
        OP_HASH160,  # 用 HASH160 验证
        hash_of_secret,
        OP_EQUAL,
        OP_ENDIF
    ]


# This is the ScriptSig that the receiver will use to redeem coins
def coinExchangeScriptSig1(sig_recipient, secret):
    return [
        secret,  # 提供秘密 x（哈希锁定条件）
        OP_0,  # 选择 ScriptPubKey 中的 `OP_IF` 分支
        sig_recipient  # 接收者的签名
    ]


# This is the ScriptSig for sending coins back to the sender if unredeemed
def coinExchangeScriptSig2(sig_sender, sig_recipient):
    return [
        sig_sender,  # 发送者的签名
        OP_1,  # 选择 ScriptPubKey 中的 `OP_ELSE` 分支
        sig_recipient  # 接收者的签名
    ]


#
#
######################################################################

