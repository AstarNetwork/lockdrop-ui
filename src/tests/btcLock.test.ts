/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PrivateKey, Message } from 'bitcore-lib';
import wif from 'wif';
import * as bitcoin from 'bitcoinjs-lib';
import * as assert from 'assert';
import { regtestUtils } from './_regtest';
import * as btcLockdrop from '../helpers/lockdrop/BitcoinLockdrop';
import bip68 from 'bip68';
import * as plasmUtils from '../helpers/plasmUtils';
import * as polkadotCrypto from '@polkadot/util-crypto';
import * as polkadotUtil from '@polkadot/util';
import secp256k1 from 'secp256k1';

// we use a lot of API calls in this test, it's good to extend the timeout
jest.setTimeout(60000);

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

// testnet address information
const testSet3 = {
    address: 'mzUQaN6vnYDYNNYJVpRz2ipxLcWsQg6b8z',
    signature: 'IJDLVVK3kEMZwC7pvHlSkT2TBFo0LSmvcJwqAbjW+OPtdq5umACvI2RkbZUjBO7CKMrJMNLqPFVNYGqVGwOxRds=',
    privateKey: 'cN1tduTMTGcvg3bQvyuTVbgeDHTmnDU1nPeHPWN3q9wZDbJ129nb',
    publicKey:
        '0431e12c2db27f3b07fcc560cdbff90923bf9b5b03769103a44b38426f9469172f3eef59e4f01df729428161c33ec5b32763e2e5a0072551b7808ae9d89286b37b',
};

describe('BTC signature and key validation tests', () => {
    it('verifies the signature from address', () => {
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

    it('verifies public key recovery', () => {
        const _net = bitcoin.networks.bitcoin;

        [testSet1, testSet2].forEach(testSet => {
            // mainnet version number is 128(0x08) while testnet is 239 (0xEF)
            // details from here https://en.bitcoin.it/wiki/List_of_address_prefixes
            const priv = bitcoin.ECPair.fromPrivateKey(wif.decode(testSet.privateKey, 128).privateKey);

            const pub = priv.publicKey;
            expect(pub.toString('hex').replace('0x', '')).toEqual(btcLockdrop.compressPubKey(testSet.publicKey, _net));

            expect(
                new Message('Hello World').verify(
                    '16R2kAxaUNM4xj6ykKbxEugpJdYyJzTP13',
                    'H0b22gIQIfutUzm7Z9qchdfhUtaO52alhNPK3emrkGOfbOzGHVPuWD9rMIphxniwBNgF/YN4c5C/dMwXz3yJz5k=',
                ),
            ).toBeTruthy();

            const addr1 = bitcoin.payments.p2pkh({
                pubkey: pub,
                network: _net,
            }).address!;
            const recoveredPub1 = pub.toString('hex');

            // use bitcoin js with polkadotUtil
            const msg2 = new Message('sign this too: ' + polkadotCrypto.randomAsHex(3)).magicHash();
            const sig2 = priv.sign(msg2);
            const recoveredPub2 = polkadotCrypto.secp256k1Recover(
                polkadotUtil.bufferToU8a(msg2),
                polkadotUtil.bufferToU8a(sig2),
                0,
            );

            // use bitcoin js with secp256k1
            const msg3 = new Message('sign this three: ' + polkadotCrypto.randomAsHex(4));
            const sig3 = priv.sign(msg3.magicHash());
            const recoveredPub3 = secp256k1.ecdsaRecover(
                polkadotUtil.bufferToU8a(sig3), // 64 byte signature of message (not DER, 32 byte R and 32 byte S with 0x00 padding)
                0, // number 1 or 0. This will usually be encoded in the base64 message signature
                polkadotUtil.bufferToU8a(msg3.magicHash()), // 32 byte hash of message
                true, // true if you want result to be compressed (33 bytes), false if you want it uncompressed (65 bytes) this also is usually encoded in the base64 signature
            );

            const addr2 = bitcoin.payments.p2pkh({
                pubkey: Buffer.from(recoveredPub2),
                network: _net,
            }).address!;
            const addr3 = bitcoin.payments.p2pkh({
                pubkey: Buffer.from(recoveredPub3),
                network: _net,
            }).address!;

            console.log(recoveredPub1 + '\n' + addr1);
            console.log(polkadotUtil.u8aToHex(recoveredPub2) + '\n' + addr2);
            console.log(polkadotUtil.u8aToHex(recoveredPub3) + '\n' + addr3);

            // check recovered public keys
            expect(btcLockdrop.compressPubKey(testSet.publicKey, _net)).toEqual(recoveredPub1);
            expect(Buffer.from(recoveredPub2).toString('hex')).toEqual(Buffer.from(recoveredPub3).toString('hex'));

            // check recovered addresses
            expect(testSet.address).toEqual(addr1);
            expect(addr2).toEqual(addr3);
        });
    });

    it('sign message with private key', () => {
        const signature = new Message(btcLockdrop.MESSAGE).sign(new PrivateKey(testSet1.privateKey));

        expect(new Message(btcLockdrop.MESSAGE).verify(testSet1.address, signature)).toEqual(true);
    });

    it('validates the given Bitcoin address', () => {
        expect(btcLockdrop.getNetworkFromAddress(testSet1.address)).toEqual(bitcoin.networks.bitcoin);
        expect(btcLockdrop.getNetworkFromAddress(testSet3.address)).toEqual(bitcoin.networks.testnet);

        expect(btcLockdrop.validateBtcAddress(testSet2.address)).toBeTruthy();
        // invalid address
        expect(btcLockdrop.validateBtcAddress('26R2kAxaUNb4xj6ykKbxEuGpJaYyJzTP13')).toBeFalsy();
    });

    it('recovers the public key from the signature', () => {
        const msg01 = new Message('this is message 1').magicHash();
        const sig01 = bitcoin.ECPair.fromWIF(testSet1.privateKey)
            .sign(msg01)
            .toString('base64');

        const msg02 = new Message('this is message 2').magicHash();
        const sig02 = bitcoin.ECPair.fromWIF(testSet2.privateKey)
            .sign(msg02)
            .toString('base64');

        const msg03 = new Message('this is message 3').magicHash();
        const sig03 = bitcoin.ECPair.fromWIF(testSet3.privateKey, bitcoin.networks.testnet)
            .sign(msg03)
            .toString('base64');

        const pubKey1 = btcLockdrop.getPublicKey(testSet1.address, sig01, 'this is message 1');
        const pubKey2 = btcLockdrop.getPublicKey(testSet2.address, sig02, 'this is message 2');
        const pubKey3 = btcLockdrop.getPublicKey(testSet3.address, sig03, 'this is message 3');

        expect(pubKey1).toEqual(testSet1.publicKey);
        expect(pubKey2).toEqual(testSet2.publicKey);
        expect(pubKey3).toEqual(testSet3.publicKey);
    });

    it('compresses public key', () => {
        expect(btcLockdrop.compressPubKey(testSet1.publicKey, bitcoin.networks.bitcoin)).toEqual(
            '03550f849a0b0865334dcefcc3b6bc668572e2c6205b406e9cdb57c56661fb3e29',
        );
        expect(btcLockdrop.compressPubKey(testSet3.publicKey, bitcoin.networks.testnet)).toEqual(
            '0331e12c2db27f3b07fcc560cdbff90923bf9b5b03769103a44b38426f9469172f',
        );

        expect(
            btcLockdrop.decompressPubKey(
                '03550f849a0b0865334dcefcc3b6bc668572e2c6205b406e9cdb57c56661fb3e29',
                bitcoin.networks.bitcoin,
            ),
        ).toEqual(testSet1.publicKey);
        expect(
            btcLockdrop.decompressPubKey(
                '0331e12c2db27f3b07fcc560cdbff90923bf9b5b03769103a44b38426f9469172f',
                bitcoin.networks.testnet,
            ),
        ).toEqual(testSet3.publicKey);

        const compressedKey = btcLockdrop.compressPubKey(testSet3.publicKey, bitcoin.networks.testnet);
        // checks if double compression will return the first compressed value
        expect(btcLockdrop.compressPubKey(compressedKey, bitcoin.networks.testnet)).toEqual(compressedKey);
    });
});

describe('Bitcoin lockdrop helper tests', () => {
    it('converts bitcoin to satoshi and back', () => {
        expect(btcLockdrop.satoshiToBitcoin('65462605489').toFixed()).toEqual('654.62605489');
        expect(btcLockdrop.bitcoinToSatoshi(156).toFixed()).toEqual('15600000000');

        expect(btcLockdrop.bitcoinToSatoshi(btcLockdrop.satoshiToBitcoin('95')).toNumber()).toEqual(95);
        expect(btcLockdrop.satoshiToBitcoin(btcLockdrop.bitcoinToSatoshi(10)).toNumber()).toEqual(10);
    });
});

describe('Bitcoin API fetch tests', () => {
    it('fetches transaction data from BlockStream', async () => {
        const allTxFromAddr = await btcLockdrop.getBtcTxsFromAddress('13XXaBufpMvqRqLkyDty1AXqueZHVe6iyy', 'mainnet');
        const allTxFromAddrTest = await btcLockdrop.getBtcTxsFromAddress(
            '2Mubm96PDzLyzcXJvfqX8kdyn2WHa7ssJ67',
            'testnet',
        );

        expect(allTxFromAddr.length).toEqual(2);
        expect(allTxFromAddr[0].txid).toEqual('f854aebae95150b379cc1187d848d58225f3c4157fe992bcd166f58bd5063449');

        expect(allTxFromAddrTest.length).toEqual(2);
        expect(allTxFromAddrTest[0].txid).toEqual('f02a3881823238cd4290a8e18bf45db5dd7d9f23a6a8e3d64e307f68085e0929');

        const txInfo = await btcLockdrop.getBtcTxFromTxId(
            'f854aebae95150b379cc1187d848d58225f3c4157fe992bcd166f58bd5063449',
            'mainnet',
        );
        const txInfoTestnet = await btcLockdrop.getBtcTxFromTxId(
            '2336a60b02f69a892b797b21aedafa128779338e9f69650fc87373a4f8036611',
            'testnet',
        );

        expect(txInfo.status.block_height).toEqual(293000);
        expect(txInfo.vout[0].value).toEqual(70320221545);
        expect(txInfoTestnet.status.block_height).toEqual(1770515);
        expect(txInfoTestnet.vout[0].value).toEqual(284780111);
    });

    it('fetches a transaction hahs from SoChain', async () => {
        const txId = '01cec976192e2f39ff57fdba5cba5d03094a7cf696f3f5ab89379e389ef77412';
        const txHex =
            '0100000000010219c88926f3113a8d5fb1801cd55429bd6269d229c7cbf50ac530233857fa9c3d0000000000ffffffff7fce5cf913125ce5bbb93829d819d56e461e39dcadb02ccc33298710fc6f15b40100000000ffffffff02d29e09000000000017a914d550b302301e25bf8f2c5115a31f8511bdbfdd948722c2050000000000160014aeda84ee9434c2259966b95298323b989ec4809502483045022100f6dbf811dc959f6f626da873ce54193efa5b28d81b14c6c0cf7c9237728993fb02206ff5d41e10b000867d345ec183e1dc9cd50cbdf7cd10efeb5366dd96dc474747012102b845db7300f3208891ea36eebdb1742b846783cefb0978d72d8e5d9b827022be024730440220619094ab5daa0000db9d9905059e9a61951f61764ce6f96ec45026dde2e27f9c02205f63448a55b9587395897430e98452fd5a07a074ad8747501c86f5fda7640010012102b845db7300f3208891ea36eebdb1742b846783cefb0978d72d8e5d9b827022be00000000';

        const res = await btcLockdrop.getTransactionHex(txId, 'BTCTEST');

        expect(res).toEqual(txHex);
    });
});

describe('BTC lock script tests', () => {
    // force update MTP
    beforeEach(async () => {
        await regtestUtils.mine(11);
    });

    it(
        'signs a BTC transaction',
        () => {
            const privkey = 'cQ6483mDWwoG8o4tn6nU9Jg52RKMjPUWXSY1vycAyPRXQJ1Pn2Rq';
            const txhex =
                '0100000001f7e6430096cd2790bac115aaab22c0a50fb0a1794305302e1a399e81d8d354f4020000006a47304402205793a862d193264afc32713e2e14541e1ff9ebb647dd7e7e6a0051d0faa87de302205216653741ecbbed573ea2fc053209dd6980616701c27be5b958a159fc97f45a012103e877e7deb32d19250dcfe534ea82c99ad739800295cd5429a7f69e2896c36fcdfeffffff0340420f00000000001976a9145c7b8d623fba952d2387703d051d8e931a6aa0a188ac8bda2702000000001976a9145a0ef60784137d03e7868d063b05424f2f43799f88ac40420f00000000001976a9145c7b8d623fba952d2387703d051d8e931a6aa0a188ac2fcc0e00';

            const privkeypair = bitcoin.ECPair.fromWIF(privkey, bitcoin.networks.testnet);
            const transaction = bitcoin.Transaction.fromHex(txhex);
            const builder = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
            builder.addInput(transaction, 0, 0);
            builder.addOutput('n4pSwWQZm8Wter1wD6n8RDhEwgCqtQgpcY', 6000);
            builder.sign(0, privkeypair);
        },
        200 * 1000,
    );

    it('validates block sequence inputs', () => {
        expect(btcLockdrop.daysToBlockSequence(4)).toEqual(576);

        expect(() => btcLockdrop.daysToBlockSequence(3.4)).toThrowError(
            'Lock days must be a valid integer, but received: 3.4',
        );

        expect(() => btcLockdrop.btcLockScript(testSet2.publicKey, 655356, bitcoin.networks.bitcoin)).toThrowError(
            'Block sequence cannot be more than 65535',
        );
    });

    it('validates generating lock script', () => {
        expect(() =>
            btcLockdrop.btcLockScript(
                testSet2.privateKey,
                btcLockdrop.daysToBlockSequence(3),
                bitcoin.networks.bitcoin,
            ),
        ).toThrowError('Invalid public key');

        expect(() => btcLockdrop.getLockP2SH(-1, testSet3.publicKey, bitcoin.networks.testnet)).toThrowError(
            'Block sequence cannot be a negative number',
        );
        expect(() => btcLockdrop.getLockP2SH(301, testSet1.publicKey, bitcoin.networks.bitcoin)).toThrowError(
            'Lock duration must be between 30 days to 300 days',
        );

        expect(() => {
            btcLockdrop.getLockP2SH(
                30,
                'cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe',
                bitcoin.networks.testnet,
            );
        }).toThrowError('Invalid public key');

        expect(() => {
            btcLockdrop.btcLockScript(
                testSet3.publicKey,
                btcLockdrop.daysToBlockSequence(-10),
                bitcoin.networks.testnet,
            );
        }).toThrowError('Block sequence cannot be a negative number');
    });

    it('generates BTC lockdrop parameter', async () => {
        // lock script locking for 3 days on testnet
        const scriptAddr = '2N1MH1ikVDSh3wyqvGHaG9pKfFHC6mUiDiZ';
        // known lock TX hash (https://api.blockcypher.com/v1/btc/test3/txs/384f54793b753e4acd9a9aca1da3ef7609931800d0a86de8c4ae6dc8ab7a96fd)
        const lockTXHash = '0x384f54793b753e4acd9a9aca1da3ef7609931800d0a86de8c4ae6dc8ab7a96fd';
        const locks = await btcLockdrop.getLockParameter(
            scriptAddr,
            3,
            btcLockdrop.compressPubKey(testSet3.publicKey, bitcoin.networks.testnet),
            'testnet',
        );
        const lockParams = locks.map(i => {
            return plasmUtils.structToLockdrop(i as any);
        });

        expect(lockParams[lockParams.length - 1].transactionHash.toHex()).toEqual(lockTXHash);
    });

    it(
        'lock BTC on script and redeem',
        async () => {
            const DURATION = 10; // Lock duration in blocks
            const VALUE = 2000000; // Lock value in Satoshi
            const FEE = 200; // Relay fee

            const alice = bitcoin.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', regtest);
            const pubkey = alice.publicKey.toString('hex');

            // create a P2SH from the given data
            const p2sh = bitcoin.payments.p2sh({
                network: regtest,
                redeem: {
                    output: btcLockdrop.btcLockScript(pubkey, bip68.encode({ blocks: DURATION }), regtest),
                },
            });

            // fund the P2SH(CSV) address (this will lock the token with VALUE + FEE)
            const unspent = await regtestUtils.faucet(p2sh.address!, VALUE + FEE);
            const lockTx = (await regtestUtils.fetch(unspent.txId)).txHex;

            // create the redeem UTXO
            const tx = await btcLockdrop.btcUnlockTx(
                alice,
                regtest,
                bitcoin.Transaction.fromHex(lockTx),
                p2sh.redeem!.output!,
                bip68.encode({ blocks: DURATION }),
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
            await regtestUtils.mine(DURATION - 5);
            await regtestUtils.broadcast(tx.toHex()).catch(err => {
                assert.throws(() => {
                    if (err) throw err;
                }, /Error: non-BIP68-final \(code 64\)/);
            });

            // mine the number of blocks needed for unlocking
            await regtestUtils.mine(10);
            // Try to redeem at unlocking time
            await regtestUtils.broadcast(tx.toHex());
            // this method should work without throwing an error
            await regtestUtils.verify({
                txId: tx.getId(),
                address: regtestUtils.RANDOM_ADDRESS,
                vout: 0,
                value: VALUE,
            });
        },
        200 * 1000,
    ); // extend jest async resolve timeout

    it(
        'tries to lock with Alice and redeem it with Bob',
        async () => {
            const DURATION = 5; // Lock duration in days
            const VALUE = 2000000; // Lock value in Satoshi
            const FEE = 200; // Relay fee

            const alice = bitcoin.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', regtest);
            const bob = bitcoin.ECPair.makeRandom({ network: regtest });

            const pubkey = alice.publicKey.toString('hex');

            // create a P2SH from the given data
            const p2sh = bitcoin.payments.p2sh({
                network: regtest,
                redeem: {
                    output: btcLockdrop.btcLockScript(pubkey, bip68.encode({ blocks: DURATION }), regtest),
                },
            });

            // fund the P2SH(CSV) address (this will lock the token with VALUE + FEE)
            const unspent = await regtestUtils.faucet(p2sh.address!, VALUE + FEE);
            const lockTx = (await regtestUtils.fetch(unspent.txId)).txHex;

            // create the redeem UTXO
            const tx = await btcLockdrop.btcUnlockTx(
                bob,
                regtest,
                bitcoin.Transaction.fromHex(lockTx),
                p2sh.redeem!.output!,
                bip68.encode({ blocks: DURATION }),
                regtestUtils.RANDOM_ADDRESS,
                FEE,
            );

            // mine the number of blocks needed for unlocking
            await regtestUtils.mine(DURATION * 2);

            // Try to redeem at unlocking time
            // note: sometimes this throws "mandatory-script-verify-flag-failed (Signature must be zero for failed CHECK(MULTI)SIG operation) (code 16)"
            // or "mandatory-script-verify-flag-failed (Script evaluated without error but finished with a false/empty top stack element) (code 16)"
            // so instead of checking the exact error message, we just check if it throws or not
            await expect(regtestUtils.broadcast(tx.toHex())).rejects.toThrowError();
        },
        200 * 1000, // extend jest async resolve timeout
    );
});
