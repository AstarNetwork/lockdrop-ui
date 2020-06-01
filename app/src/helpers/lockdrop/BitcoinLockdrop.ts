import sha256 from 'fast-sha256';
import eccrypto from 'eccrypto';
import crypto from 'crypto-ts';
import base58 from 'bs58';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/;';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/;';

export const message = 'plasm network btc lock';

export const MAGIC_MESSAGE = 'Bitcoin Signed Message:\n';

export const getPublicKey = () => {
    console.log('get pub key');
};

export const createLockScript = () => {
    console.log('create lock script');
};

export const verifyOwner = (addr: string, sig: string) => {
    console.log(addr + sig);
};

function msgNumToVarInt(i: number) {
    if (i < 0xfd) {
        return new Uint8Array([i]);
    } else if (i <= 0xffff) {
        // can't use numToconstInt from bitcoinjs, BitcoinQT wants big endian here (!)
        return new Uint8Array([0xfd, i & 255, i >>> 8]);
    } else if (i <= 0xffffffff) {
        return new Uint8Array([0xfe, i & 255, (i >>> 8) & 255, (i >>> 16) & 255, i >>> 24]);
    } else {
        throw 'message too large';
    }
}

// Uint8Array message should be a utf8 buffer
function msgBytes(message: string | Uint8Array) {
    if (typeof message === 'string') {
        // convert a utf8 string into a Uin8Array
        const b = Uint8Array.from(Buffer.from(message, 'utf8'));
        return Uint8Array.from(Buffer.concat([msgNumToVarInt(b.length), b]));
    } else {
        // if instance is a Uin8Array just concat it
        return Uint8Array.from(Buffer.concat([msgNumToVarInt(message.length), message]));
    }
}

export function hashBtcMessage(message: string) {
    const prefix1 = msgBytes(MAGIC_MESSAGE);
    const prefix2 = msgBytes(message);

    const buf = Buffer.concat([prefix1, prefix2]);
    // bitcoin uses double sha2 for hashing
    return sha256(sha256(buf));
}

function signMessage(message: string, privateKey: string) {
    return eccrypto.getPublic(base58.decode(privateKey));
}
