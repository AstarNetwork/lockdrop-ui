import { Message } from 'bitcore-lib';
import * as bitcoinjs from 'bitcoinjs-lib';
import bip68 from 'bip68';
import { UnspentTx, BtcNetwork } from '../../types/LockdropModels';
import { Transaction, Signer, Network } from 'bitcoinjs-lib';
import TrezorConnect from 'trezor-connect';
import { BlockCypherApi } from '../../types/BlockCypherTypes';
import BigNumber from 'bignumber.js';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/';

/**
 * the message that will be hashed and signed by the client
 */
export const MESSAGE = 'plasm network btc lock';

/**
 * returns a blob url for the qr encoded bitcoin address
 * @param btcAddress bitcoin address
 */
export async function qrEncodeUri(btcAddress: string, size = 300) {
    const qrCode = URL.createObjectURL(
        await fetch(`https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${btcAddress}`).then((res) =>
            res.blob(),
        ),
    );

    return qrCode;
}

/**
 * returns the detailed information of the given address via blockcypher API calls.
 * such information includes transaction references, account balances, and more
 * @param address bitcoin address
 * @param network network type
 * @param limit filters the number of transaction references
 */
export async function getAddressEndpoint(address: string, network: 'main' | 'test3', limit = 20) {
    const api = `https://api.blockcypher.com/v1/btc/${network}/addrs/${address}?limit=${limit}`;

    const res = await (await fetch(api)).text();

    if (res.includes('error')) {
        throw new Error(res);
    }

    const addressEndpoint: BlockCypherApi.BtcAddress = JSON.parse(res);
    return addressEndpoint;
}

/**
 * returns the detailed information of the given transaction hash via blockcypher API calls.
 * such information includes transaction input, output, addresses, and more
 * @param txHash bitcoin transaction hash
 * @param network network type
 * @param limit filters the number of TX inputs and outputs
 */
export async function getTransactionEndpoint(txHash: string, network: 'main' | 'test3', limit = 20) {
    const api = `https://api.blockcypher.com/v1/btc/${network}/txs/${txHash}?limit=${limit}`;

    const res = await (await fetch(api)).text();

    if (res.includes('error')) {
        throw new Error(res);
    }

    const hashEndpoint: BlockCypherApi.BtcTxHash = JSON.parse(res);
    return hashEndpoint;
}

/**
 * converts satoshis to bitcoin
 * @param satoshi number of satoshis
 */
export function satoshiToBitcoin(satoshi: BigNumber | number) {
    // 1 bitcoin = 100,000,000 satoshis

    const denominator = new BigNumber(10).pow(new BigNumber(8));

    // if the parameter is a number, convert it to BN
    if (typeof satoshi === 'number') {
        return new BigNumber(satoshi).div(denominator);
    }
    return satoshi.div(denominator);
}

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

// export function createLockdropClaim() {
//     const lockdropClaim: Lockdrop = {
//         type: 1, //u8
//         transactionHash: H256, //H256
//         publicKey: U8aFixed, // [u8; 33]
//         duration: u64, // u64
//         value: u128, // u128
//     };
// }

/**
 * returns the network type that the given address belongs to.
 * @param address bitcoin address
 */
export function getNetworkFromAddress(address: string) {
    // sources: https://en.bitcoin.it/wiki/List_of_address_prefixes
    // main net public key hash prefixes
    const mainNetPref = ['1', '3', 'bc1'];
    // test net public key hash prefixes
    const testNetPref = ['m', 'n', 'tb1', '2'];

    // check for regex match from the given address and array
    if (new RegExp(`^(${mainNetPref.join('|')})`).test(address)) {
        return BtcNetwork.MainNet;
    } else if (new RegExp(`^(${testNetPref.join('|')})`).test(address)) {
        return BtcNetwork.TestNet;
    } else {
        throw new Error('Invalid Bitcoin address');
    }
    //todo: refactor all functions to automatically detect the network using this function
    // rather than having to provide it manually
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
