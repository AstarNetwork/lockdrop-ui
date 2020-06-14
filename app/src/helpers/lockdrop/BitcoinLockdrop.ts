import { Message } from 'bitcore-lib';
import * as bitcoin from 'bitcoinjs-lib';
import bip68 from 'bip68';
import { UnspentTx } from '../../models/LockdropModels';
import { Transaction, Signer } from 'bitcoinjs-lib';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/';
//const QR_GEN_API = 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=';

export const MESSAGE = 'plasm network btc lock';

export function daysToBlockSequence(days: number) {
    const blocksPerDay = 144; //10 min per block. day = 6 * 24
    return bip68.encode({ blocks: days * blocksPerDay });
}

export function btcLockScript(publicKeyHex: string, blocks: number): Buffer {
    return bitcoin.script.fromASM(
        `
        ${bitcoin.script.number.encode(bip68.encode({ blocks })).toString('hex')}
        OP_CHECKSEQUENCEVERIFY
        OP_DROP
        ${publicKeyHex}
        OP_CHECKSIG
        `
            .trim()
            .replace(/\s+/g, ' '),
    );
}

export function getPublicKey(address: string, signature: string) {
    return new Message(MESSAGE).recoverPublicKey(address, signature);
}

export function btcUnlockTx(
    signer: Signer,
    network: bitcoin.networks.Network,
    lockTx: UnspentTx,
    lockScript: Buffer,
    lockBlocks: number,
    recipient: string,
    fee: number, // satoshis
): Transaction {
    function idToHash(txid: string): Buffer {
        return Buffer.from(txid, 'hex').reverse();
    }
    function toOutputScript(address: string): Buffer {
        return bitcoin.address.toOutputScript(address, network);
    }

    const sequence = bip68.encode({ blocks: lockBlocks });
    const tx = new bitcoin.Transaction();
    tx.version = 2;
    tx.addInput(idToHash(lockTx.txId), lockTx.vout, sequence);
    tx.addOutput(toOutputScript(recipient), lockTx.value - fee);

    const hashType = bitcoin.Transaction.SIGHASH_ALL;
    const signatureHash = tx.hashForSignature(0, lockScript, hashType);
    const signature = bitcoin.script.signature.encode(signer.sign(signatureHash), hashType);

    const redeemScriptSig = bitcoin.payments.p2sh({
        network,
        redeem: {
            network,
            output: lockScript,
            input: bitcoin.script.compile([signature]),
        },
    }).input;
    if (redeemScriptSig instanceof Buffer) {
        tx.setInputScript(0, redeemScriptSig);
    } else {
        throw new Error('Transaction is invalid');
    }

    return tx;
}
