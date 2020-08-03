/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Message } from 'bitcore-lib';
import * as btcLockdrop from '../helpers/lockdrop/BitcoinLockdrop';
import lockTx from './data/ledgerBtcLock.json';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AppBtc from '@ledgerhq/hw-app-btc';

const btcApi: AppBtc | undefined;

const ledgerApiInstance = async () => {
    if (btcApi === undefined) {
        const ts = await TransportNodeHid.create();
        const btc = new AppBtc(ts);
        setBtcApi(btc);
        return btc;
    } else {
        return btcApi;
    }
};

describe('Test HID connection with Ledger from node', () => {
    it('verifies the signature from address', async () => {
        const btc = await ledgerApiInstance();
        const walletData = await btc.getWalletPublicKey(addressPath);
        console.log(walletData);
        //verify the first set of signature
        expect(
            new Message('aas').verify(
                '1En7wYxwUiuFfma1Pu3N6d5gopRPvWoj4q',
                'IAqCpjxYFTl/OtYzLYb8VVYgyspmiEj43GQoG8R10hLKVOWF6YNXdBlx2U08HEG+oyyu3eZGoYoAfFcRFcQ+dBM=',
            ),
        ).toBeTruthy();

        // verify the second set of signature
        expect(
            new Message('Hello World').verify(
                '16R2kAxaUNM4xj6ykKbxEugpJdYyJzTP13',
                'H0b22gIQIfutUzm7Z9qchdfhUtaO52alhNPK3emrkGOfbOzGHVPuWD9rMIphxniwBNgF/YN4c5C/dMwXz3yJz5k=',
            ),
        ).toBeTruthy();

        expect(new Message(btcLockdrop.MESSAGE).verify(testSet1.address, testSet2.signature)).toBeFalsy();
        expect(
            new Message(btcLockdrop.MESSAGE).verify('16R2kAxaUNM4xj6ykKbxEugpJdYyJzTP13', testSet3.signature),
        ).toBeFalsy();
    });
});
