import { Message } from 'bitcore-lib';
import * as bitcoin from 'bitcoinjs-lib';
import bip68 from 'bip68';
import { UnspentTx, BtcNetwork } from '../../types/LockdropModels';
import { Transaction, Signer, Network } from 'bitcoinjs-lib';
import TrezorConnect from 'trezor-connect';
import { Toast } from 'react-toastify';
//import bs58 from 'bs58';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/';
//const QR_GEN_API = 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=';

export const MESSAGE = 'plasm network btc lock';

// initialize Trezor instance. This will return true if successful
export function initTrezor() {
    try {
        TrezorConnect.init({
            manifest: {
                email: 'hoonkim@stake.co.jp',
                appUrl: 'https://lockdrop.plasmnet.io',
            },
            debug: true,
        });
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export function verifiedInput(address: string, signature: string, toast: Toast, network: BtcNetwork) {
    if (network === BtcNetwork.MainNet && address[0] !== '1') {
        toast.error('Please use a main net Bitcoin address');
        return false;
    } else if (network === BtcNetwork.TestNet && address[0] !== '2') {
        toast.error('Please use a test net Bitcoin address');
        return false;
    }

    return new Message(MESSAGE).verify(address, signature);
}

// converts an uncompressed public key to a compressed public key
export function compressedPubKey(publicKey: string) {
    const pubKeyPair = bitcoin.ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'), { compressed: true });
    return pubKeyPair.publicKey.toString('hex');
}

// converts an compressed public key to a uncompressed public key
export function uncompressedPubKey(publicKey: string) {
    const pubKeyPair = bitcoin.ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'), { compressed: false });
    return pubKeyPair.publicKey.toString('hex');
}

// returns a public key from the given address and signature
// by default this will return an uncompressed public key
export function getPublicKey(address: string, signature: string, compressed?: boolean) {
    const compressedPubKey = new Message(MESSAGE).recoverPublicKey(address, signature.replace(/(\r\n|\n|\r)/gm, ''));
    return compressed ? compressedPubKey : uncompressedPubKey(compressedPubKey);
}

// used for CHECKSEQUENCEVERIFY relative time lock. converts days to bip68 encoded block number
export function daysToBlocks(days: number) {
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

export function btcUnlockTx(
    signer: Signer,
    network: Network,
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
