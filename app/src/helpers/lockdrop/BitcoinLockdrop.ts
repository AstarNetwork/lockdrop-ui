import { Message } from 'bitcore-lib';
import * as bitcoinjs from 'bitcoinjs-lib';
import bip68 from 'bip68';
import { UnspentTx, BtcNetwork } from '../../types/LockdropModels';
import { Transaction, Signer, Network } from 'bitcoinjs-lib';
import TrezorConnect from 'trezor-connect';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/';

/**
 * returns a url for the qr encoded bitcoin address
 * @param btcAddress bitcoin address
 */
export async function qrEncodeUri(btcAddress: string, size = 300) {
    const qrCode = URL.createObjectURL(
        await fetch(`https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${btcAddress}`).then(res =>
            res.blob(),
        ),
    );

    return qrCode;
}

/**
 * the message that will be hashed and signed by the client
 */
export const MESSAGE = 'plasm network btc lock';

/**
 * initialize Trezor instance.
 * This will return true if successful
 */
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

// export function verifySignature(address: string, signature: string, toast: Toast, network: BtcNetwork) {
//     if (network === BtcNetwork.MainNet && address[0] !== '1') {
//         toast.error('Please use a main net Bitcoin address');
//         return false;
//     } else if (network === BtcNetwork.TestNet && address[0] !== '2') {
//         toast.error('Please use a test net Bitcoin address');
//         return false;
//     }

//     return new Message(MESSAGE).verify(address, signature);
// }

/**
 * checks the BTC address prefix with the given Bitcoin network
 * @param address bitcoin address
 * @param network bitcoin network
 */
export function verifyAddressNetwork(address: string, network: BtcNetwork) {
    // main net public key hash prefixes
    const pubkeyHash = '1';
    const bech32 = 'bc1';

    // test net public key hash prefixes
    const testPubkeyHash = 'm' || 'n';
    const testBech32 = 'tb1';

    switch (network) {
        case BtcNetwork.MainNet:
            return address.startsWith(pubkeyHash) || address.startsWith(bech32);
        case BtcNetwork.TestNet:
            return address.startsWith(testPubkeyHash) || address.startsWith(testBech32);
        default:
            return false;
    }
}

/**
 * converts an compressed public key to a uncompressed public key
 * @param publicKey compressed BTC public key
 */
export function uncompressedPubKey(publicKey: string) {
    const pubKeyPair = bitcoinjs.ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'), { compressed: false });
    return pubKeyPair.publicKey.toString('hex');
}

/**
 * returns a public key from the given address and signature
 * by default this will return an uncompressed public key
 * @param address bitcoin address
 * @param signature signature for signing the plasm network message
 * @param compression should the public key be compressed or not
 */
export function getPublicKey(address: string, signature: string, compression?: 'compressed' | 'uncompressed') {
    const compressedPubKey = new Message(MESSAGE).recoverPublicKey(address, signature.replace(/(\r\n|\n|\r)/gm, ''));
    return compression === 'compressed' ? compressedPubKey : uncompressedPubKey(compressedPubKey);
}

/**
 * used for CHECKSEQUENCEVERIFY relative time lock.
 * this converts days to bip68 encoded block number.
 * @param days number of days to be converted to sequence number
 */
export function daysToBlocks(days: number) {
    const blocksPerDay = 144; //10 min per block. day = 6 * 24
    return bip68.encode({ blocks: days * blocksPerDay });
}

/**
 * create a bitcoin lock script with the given public key.
 * this will lock the token for the given number of block sequence
 * @param publicKeyHex uncompressed BTC public key in hex string
 * @param blocks number of block sequence the token will be locked for
 */
export function btcLockScript(publicKeyHex: string, blocks: number): Buffer {
    return bitcoinjs.script.fromASM(
        `
        ${bitcoinjs.script.number.encode(bip68.encode({ blocks })).toString('hex')}
        OP_CHECKSEQUENCEVERIFY
        OP_DROP
        ${publicKeyHex}
        OP_CHECKSIG
        `
            .trim()
            .replace(/\s+/g, ' '),
    );
}

/**
 * creates a P2SH instance that locks the sent token for the given duration.
 * the locked tokens can only be claimed by the provided public key
 * @param duration the lock duration in days
 * @param publicKey uncompressed public key of the locker
 * @param network bitcoin network the script will generate for
 */
export function getLockP2SH(duration: number, publicKey: string, network: BtcNetwork) {
    const netType = network === BtcNetwork.MainNet ? bitcoinjs.networks.bitcoin : bitcoinjs.networks.testnet;

    return bitcoinjs.payments.p2sh({
        network: netType,
        redeem: {
            output: btcLockScript(publicKey, daysToBlocks(duration)),
        },
    });
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
        return bitcoinjs.address.toOutputScript(address, network);
    }

    const sequence = bip68.encode({ blocks: lockBlocks });
    const tx = new bitcoinjs.Transaction();
    tx.version = 2;
    tx.addInput(idToHash(lockTx.txId), lockTx.vout, sequence);
    tx.addOutput(toOutputScript(recipient), lockTx.value - fee);

    const hashType = bitcoinjs.Transaction.SIGHASH_ALL;
    const signatureHash = tx.hashForSignature(0, lockScript, hashType);
    const signature = bitcoinjs.script.signature.encode(signer.sign(signatureHash), hashType);

    const redeemScriptSig = bitcoinjs.payments.p2sh({
        network,
        redeem: {
            network,
            output: lockScript,
            input: bitcoinjs.script.compile([signature]),
        },
    }).input;
    if (redeemScriptSig instanceof Buffer) {
        tx.setInputScript(0, redeemScriptSig);
    } else {
        throw new Error('Transaction is invalid');
    }

    return tx;
}
