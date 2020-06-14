/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrivateKey, Message } from 'bitcore-lib';
import eccrypto from 'eccrypto';
import wif from 'wif';
import * as bitcoin from 'bitcoinjs-lib';
import * as assert from 'assert';
import { regtestUtils } from './_regtest';
import bip68 from 'bip68';
import { btcLockScript, btcUnlockTx, MESSAGE } from '../helpers/lockdrop/BitcoinLockdrop';

const regtest = regtestUtils.network;

const testSet1 = {
    address: '17L3qWGDUBGN5V8d9yqXgJqiwwnEugL1UJ',
    signature: 'H6Nknn6QTRaTj0Ig1+nodB7g2vers+C9OMoa6xUiKXddTN7uEMv0rmCaToSGyRfLAEKqi8op8D+kUEJXx7/h9TI=',
    privateKey: 'KwdnN71f76aF2nXjTNw3phitaQhvLAxkx6uRndwmmXzRR9hgDB3y', // WIF
    publicKey:
        '04550f849a0b0865334dcefcc3b6bc668572e2c6205b406e9cdb57c56661fb3e29ff27523c3e014fcc18561da324c6dbf60b2820db6afabea34299e4acc2ae78ef',
};

const testSet2 = {
    address: '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
    signature: 'GwigiVdN7WRlrzksnCz8oC+GzgETW8YCxCZ+xcIerGZIL7MClCgHMqc07bkd736ynPCTuWyPPlSXLY+z5JNUDgc=',
    privateKey: '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss', // WIF
    publicKey:
        '04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd5b8dec5235a0fa8722476c7709c02559e3aa73aa03918ba2d492eea75abea235',
};

// tests
describe('BTC signature tests', () => {
    it('verifies the signature from address', () => {
        //verify the first set of signature
        expect(
            new Message('aas').verify(
                '1En7wYxwUiuFfma1Pu3N6d5gopRPvWoj4q',
                'IAqCpjxYFTl/OtYzLYb8VVYgyspmiEj43GQoG8R10hLKVOWF6YNXdBlx2U08HEG+oyyu3eZGoYoAfFcRFcQ+dBM=',
            ),
        ).toEqual(true);

        // verify the second set of signature
        expect(
            new Message('Hello World').verify(
                '16R2kAxaUNM4xj6ykKbxEugpJdYyJzTP13',
                'H0b22gIQIfutUzm7Z9qchdfhUtaO52alhNPK3emrkGOfbOzGHVPuWD9rMIphxniwBNgF/YN4c5C/dMwXz3yJz5k=',
            ),
        ).toEqual(true);
    });

    it('verifies public key', () => {
        // mainnet version number is 128(0x08) while testnet is 239 (0xEF)
        // details from here https://en.bitcoin.it/wiki/List_of_address_prefixes
        const priv = wif.decode(testSet1.privateKey, 128);

        const pub = eccrypto.getPublic(priv.privateKey);
        expect(pub.toString('hex').replace('0x', '')).toEqual(testSet1.publicKey);

        expect(
            new Message('Hello World').verify(
                '16R2kAxaUNM4xj6ykKbxEugpJdYyJzTP13',
                'H0b22gIQIfutUzm7Z9qchdfhUtaO52alhNPK3emrkGOfbOzGHVPuWD9rMIphxniwBNgF/YN4c5C/dMwXz3yJz5k=',
            ),
        ).toEqual(true);
    });

    it('sign message with private key', () => {
        const signature = new Message(MESSAGE).sign(new PrivateKey(testSet1.privateKey));

        expect(new Message(MESSAGE).verify(testSet1.address, signature)).toEqual(true);
    });

    it('recovers the public key from the signature', () => {
        const hashedMessage = new Message(MESSAGE);

        const sig = hashedMessage.sign(new PrivateKey(testSet2.privateKey));

        const pubKey = hashedMessage.recoverPublicKey(testSet2.address, sig);
        //console.log(pubKey);
        expect(pubKey).toEqual(testSet2.publicKey);
    });
});

describe('BTC lock script tests', () => {
    // force update MTP
    beforeEach(async () => {
        await regtestUtils.mine(11);
    });

    it('signs a BTC transaction', () => {
        const privkey = 'cQ6483mDWwoG8o4tn6nU9Jg52RKMjPUWXSY1vycAyPRXQJ1Pn2Rq';
        const txhex =
            '0100000001f7e6430096cd2790bac115aaab22c0a50fb0a1794305302e1a399e81d8d354f4020000006a47304402205793a862d193264afc32713e2e14541e1ff9ebb647dd7e7e6a0051d0faa87de302205216653741ecbbed573ea2fc053209dd6980616701c27be5b958a159fc97f45a012103e877e7deb32d19250dcfe534ea82c99ad739800295cd5429a7f69e2896c36fcdfeffffff0340420f00000000001976a9145c7b8d623fba952d2387703d051d8e931a6aa0a188ac8bda2702000000001976a9145a0ef60784137d03e7868d063b05424f2f43799f88ac40420f00000000001976a9145c7b8d623fba952d2387703d051d8e931a6aa0a188ac2fcc0e00';

        const privkeypair = bitcoin.ECPair.fromWIF(privkey, bitcoin.networks.testnet);
        const transaction = bitcoin.Transaction.fromHex(txhex);
        const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
        builder.addInput(transaction, 0, 0);
        builder.addOutput('n4pSwWQZm8Wter1wD6n8RDhEwgCqtQgpcY', 6000);
        builder.sign(0, privkeypair);
    });

    it('lock BTC on script and redeem', async () => {
        const DURATION = 10;     // Lock duration in blocks
        const VALUE = 2000000;  // Lock value in Satoshi
        const FEE = 200;        // Relay fee

        const alice = bitcoin.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', regtest);
        const pubkey = alice.publicKey.toString('hex');

        const p2sh = bitcoin.payments.p2sh({
            network: regtest,
            redeem: {
                output: btcLockScript(pubkey, DURATION),
            },
        });

        // fund the P2SH(CCSV) address (THIS IS LOCK ACTION)
        const unspent = await regtestUtils.faucet(p2sh.address!, VALUE + FEE);
        const tx = btcUnlockTx(
            alice,
            regtest,
            unspent,
            p2sh.redeem!.output!,
            DURATION,
            regtestUtils.RANDOM_ADDRESS,
            FEE,
        );

        // Try to redeem at lock time
        await regtestUtils.broadcast(tx.toHex()).catch(err => {
            assert.throws(() => {
                if (err) throw err;
            }, /Error: non-BIP68-final \(code 64\)/);
        });

        // Try to redeem for few blocks before unlocking
        await regtestUtils.mine(DURATION-2);
        await regtestUtils.broadcast(tx.toHex()).catch(err => {
            assert.throws(() => {
                if (err) throw err;
            }, /Error: non-BIP68-final \(code 64\)/);
        });

        await regtestUtils.mine(2);
        // Try to redeem at unlocking time
        await regtestUtils.broadcast(tx.toHex());
        await regtestUtils.verify({
            txId: tx.getId(),
            address: regtestUtils.RANDOM_ADDRESS,
            vout: 0,
            value: VALUE,
        });
    }, 10 * 1000); // extend jest async resolve timeout
});
