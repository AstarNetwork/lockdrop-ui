/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

// this test is for checking ledger API for signing BTC lock transaction.
// this test is meant to be used with a specific Ledger device.
import * as btcLockdrop from '../helpers/lockdrop/BitcoinLockdrop';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import Transport from '@ledgerhq/hw-transport';
import AppBtc from '@ledgerhq/hw-app-btc';
import * as bitcoinjs from 'bitcoinjs-lib';

// lock transaction made with BTC test net from Ledger.
// this transaction was sent from a SegWit wallet
import lockTx from './data/ledgerBtcLock.json';

jest.setTimeout(60 * 1000);

const ADDRESS_PATH = "m/44'/1'/0'";

let btcApi: AppBtc;
let transport: Transport<string>;

const ledgerApiInstance = async () => {
    if (typeof btcApi === 'undefined') {
        console.log('connecting to ledger...');
        transport = await TransportNodeHid.create();
        const btc = new AppBtc(transport);
        btcApi = btc;
    }

    return btcApi;
};

beforeAll(async () => {
    console.log('connecting to ledger...');
    btcApi = await ledgerApiInstance();
}, 10 * 1000);

afterAll(async () => {
    await transport.close();
    console.log('closed ledger transport');
});

describe('Test HID connection with Ledger from node', () => {
    if (typeof btcApi !== 'undefined') {
        it('verifies the signature from address', async () => {
            const walletData = await btcApi.getWalletPublicKey(ADDRESS_PATH);
            const ledgerPubKey =
                '04586ec0f213895f91a2e5dec5afec5d0910be1b5b356c6d53e9fdffbdaaff82e9ec9d48ac045a9cc7b5102893136dacf5a4b2305c6b13494261e6c22d975f7744';
            console.log(walletData);
            expect(walletData.publicKey).toEqual(ledgerPubKey);
            expect(walletData.bitcoinAddress).toEqual('tb1q4mdgfm55xnpztxtxh9ffsv3mnz0vfqy4s6d7cc');
        });

        it('checks Ledger transaction splitting from hex', async () => {
            const rawTx = await btcLockdrop.getTransactionHex(lockTx.txid, 'BTCTEST');

            const ledgerTx = btcApi.splitTransaction(rawTx);
            expect(ledgerTx.inputs.length).toEqual(lockTx.vin.length);
        });

        it('verifies the signature from address', async () => {
            const walletData = await btcApi.getWalletPublicKey(ADDRESS_PATH);
            const ledgerPubKey =
                '04586ec0f213895f91a2e5dec5afec5d0910be1b5b356c6d53e9fdffbdaaff82e9ec9d48ac045a9cc7b5102893136dacf5a4b2305c6b13494261e6c22d975f7744';
            console.log(walletData);
            expect(walletData.publicKey).toEqual(ledgerPubKey);
            expect(walletData.bitcoinAddress).toEqual('tb1q4mdgfm55xnpztxtxh9ffsv3mnz0vfqy4s6d7cc');
        });

        it('checks Ledger transaction splitting from hex', async () => {
            const rawTx = await btcLockdrop.getTransactionHex(lockTx.txid, 'BTCTEST');

            // SegWit is true if script signature property is empty
            const isSegWit = !!lockTx.vin[0].scriptsig === false;

            const ledgerTx = btcApi.splitTransaction(rawTx, isSegWit);
            expect(ledgerTx.inputs.length).toEqual(lockTx.vin.length);
        });

        it('signs a P2SH', async () => {
            const lockDur = 3;
            const networkType = bitcoinjs.networks.testnet;
            const ledgerPubKey =
                '04586ec0f213895f91a2e5dec5afec5d0910be1b5b356c6d53e9fdffbdaaff82e9ec9d48ac045a9cc7b5102893136dacf5a4b2305c6b13494261e6c22d975f7744';

            const lockSequence = btcLockdrop.daysToBlockSequence(lockDur);

            //const output = bitcoinjs.payments.p2pkh({ pubkey: Buffer.from(publicKey, 'hex') });
            const lockScript = btcLockdrop.getLockP2SH(lockDur, ledgerPubKey, networkType);
            if (typeof lockScript.redeem !== 'undefined') {
                try {
                    // get transaction hex
                    const rawTxHex = await btcLockdrop.getTransactionHex(lockTx.txid, 'BTCTEST');

                    // SegWit is true if script signature property is empty
                    const isSegWit = !!lockTx.vin[0].scriptsig === false;

                    const ledgerTxData = btcApi.splitTransaction(rawTxHex, isSegWit);

                    const redeem = lockScript.redeem!.output!.toString('hex');
                    const output = btcLockdrop.getLockP2SH(lockDur, ledgerPubKey, networkType);
                    console.log(ledgerTxData);

                    const res = await btcApi.signP2SHTransaction({
                        inputs: [[ledgerTxData, 1, redeem, lockSequence]],
                        associatedKeysets: [ADDRESS_PATH],
                        outputScriptHex: output.output!.toString('hex'),
                    });

                    console.log(res);
                } catch (err) {
                    console.log(err);
                }
            }
        });
    } else {
        console.log('could not connect to Ledger, skipping Ledger device tests');
    }
});
