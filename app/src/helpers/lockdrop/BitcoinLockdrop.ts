import { Message } from 'bitcore-lib';
import * as bitcoin from 'bitcoinjs-lib';
import bip68 from 'bip68';

//const BTC_TX_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/txs/';
//const BTC_ADDR_API_TESTNET = 'https://api.blockcypher.com/v1/btc/test3/addrs/';

//const BTC_TX_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/txs/';
//const BTC_ADDR_API_MAINNET = 'https://api.blockcypher.com/v1/btc/main/addrs/';
//const QR_GEN_API = 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=';

export const MESSAGE = 'plasm network btc lock';

function daysToBlockSequence(days: number) {
    const blocksPerDay = 144; //10 min per block. day = 6 * 24
    return bip68.encode({ blocks: days * blocksPerDay });
}

export function csvLockScript(publicKeyHex: string, days: number): Buffer {
    const sequence = daysToBlockSequence(days);
    return bitcoin.script.fromASM(
        `
        ${publicKeyHex}
        OP_CHECKSIGVERIFY
        ${bitcoin.script.number.encode(sequence).toString('hex')}
        OP_CHECKSEQUENCEVERIFY
        OP_DROP
        OP_1
        `
            .trim()
            .replace(/\s+/g, ' '),
    );
}

export function getBtcPublicKey(address: string, signature: string) {
    return new Message(MESSAGE).recoverPublicKey(address, signature);
}

export function verifySignature(address: string, signature: string) {
    return new Message(MESSAGE).verify(address, signature);
}
