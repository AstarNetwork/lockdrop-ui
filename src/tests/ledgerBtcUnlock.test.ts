/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

// this test is for checking ledger API for signing BTC lock transaction.
// this test is meant to be used with a specific Ledger device.
import * as btcLockdrop from '../helpers/lockdrop/BitcoinLockdrop';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AppBtc from '@ledgerhq/hw-app-btc';

// lock transaction made with BTC test net from Ledger.
// this transaction was sent from a SegWit wallet
import lockTx from './data/ledgerBtcLock.json';

const ADDRESS_PATH = "m/44'/1'/0'";

let btcApi: AppBtc;

const ledgerApiInstance = async () => {
    if (btcApi === undefined) {
        const transport = await TransportNodeHid.create();
        const btc = new AppBtc(transport);
        btcApi = btc;
    }

    return btcApi;
};

describe('Test HID connection with Ledger from node', () => {
    beforeAll(async () => {
        btcApi = await ledgerApiInstance();
    });

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
    } else {
        console.log('could not connect to Ledger, skipping Ledger device tests');
    }
});
