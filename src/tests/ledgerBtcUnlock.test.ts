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

describe('API fetch test with lock TX', () => {
    it("fetched the lock transaction data and checks if it's the same", async () => {
        const _lockTxId = lockTx.txid;
        const txInfo = await btcLockdrop.getBtcTxFromTxId(_lockTxId, 'testnet');
        expect(txInfo.vin[0].txid).toEqual(lockTx.vin[0].txid);
        expect(txInfo.status.block_height).toEqual(lockTx.status.block_height);
    });
});

describe('Test HID connection with Ledger from node', () => {
    beforeAll(async () => {
        btcApi = await ledgerApiInstance();
    });

    it('verifies the signature from address', async () => {
        const walletData = await btcApi.getWalletPublicKey(ADDRESS_PATH);
        console.log(walletData);
        expect(walletData.publicKey).toEqual(
            '04586ec0f213895f91a2e5dec5afec5d0910be1b5b356c6d53e9fdffbdaaff82e9ec9d48ac045a9cc7b5102893136dacf5a4b2305c6b13494261e6c22d975f7744',
        );
    });
});
