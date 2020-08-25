/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import EthCrypto from 'eth-crypto';
import * as polkadotCryptoUtil from '@polkadot/util-crypto';
import * as polkadotUtil from '@polkadot/util';
import * as plasmUtils from '../helpers/plasmUtils';
import { ApiPromise, Keyring } from '@polkadot/api';
import BN from 'bn.js';
import { LockdropType } from 'src/types/LockdropModels';

const ethPubKey =
    'a27c1e09c563b1221636c7f69690a6e4d41e9c79d38518d00d5f6d3fb5d7a35407caff68e13fcd845646dc848e0649417b89acf1af435bd18f1ab2fcf20e2e61';
const plasmPubKey = '215a9a3e38ba3dcaf8120046e3f4b385b25016575ab8564973edfdb64528493b';

const sampleClaimId = '0xa94710e9db798a7d1e977b9f748ae802031eee2400a77600c526158892cd93d8';

const sampleLock = plasmUtils.createLockParam(
    LockdropType.Ethereum,
    '0x6c4364b2f5a847ffc69f787a0894191b75aa278a95020f02e4753c76119324e0',
    '0x039360c9cbbede9ee771a55581d4a53cbcc4640953169549993a3b0e6ec7984061',
    '2592000',
    '100000000000000000',
);

const ropstenLock = plasmUtils.createLockParam(
    LockdropType.Ethereum,
    '0x896d1cbe07c0207b714d87bcde04a535fec049a62c4e279dc2a6b71108afa523',
    '0x039360c9cbbede9ee771a55581d4a53cbcc4640953169549993a3b0e6ec7984061',
    '2592000',
    '100000000000000000',
);

const btcTestnet3Lock = plasmUtils.createLockParam(
    LockdropType.Bitcoin,
    '0xfd97647c573e2cde683992780c4bad2046ebbe9f90c1a44dfe4a152f3203016c',
    '0x02d9956c1c39d8c1e67e57de7310757b59102225839343f71d808ef5365b9803db',
    '2592000',
    '100000',
);

// converts a given hex string into Uint8Array
const toByteArray = (hexString: string) => {
    const result = [];
    for (let i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(result);
};

describe('Plasm ECDSA address tests', () => {
    it('checks compressed ETH pub key length', () => {
        expect(EthCrypto.publicKey.compress(ethPubKey).length).toEqual(66);
    });

    it('checks blake hashed pub key', () => {
        const compressedPubKey = EthCrypto.publicKey.compress(ethPubKey);
        const blakeHashed = polkadotCryptoUtil.blake2AsU8a(toByteArray(compressedPubKey), 256);
        expect(polkadotUtil.u8aToHex(blakeHashed)).toEqual('0x' + plasmPubKey);
    });
});

describe('Plasm lockdrop RPC tests', () => {
    // initialize a connection with the blockchain
    // change this to either local or dusty to switch networks and tests
    const plasmEndpoint = plasmUtils.PlasmNetwork.Dusty;

    let api: ApiPromise;
    const keyring = new Keyring({
        type: 'sr25519',
    });

    beforeEach(async () => {
        api = await plasmUtils.createPlasmInstance(plasmEndpoint);
    });

    it('checks plasm constants', async () => {
        const sessionDuration = api.consts.babe.epochDuration.toNumber();
        const plasmRewards = (api.consts.plasmRewards.sessionsPerEra as any).toNumber();
        const maxBlockLength = api.consts.system.maximumBlockLength.toNumber();
        expect(sessionDuration).toEqual(1440);
        expect(plasmRewards).toEqual(6);
        expect(maxBlockLength).toEqual(5242880);
    });

    it('queries plasm account balance', async () => {
        // the alice wallet from a dev chain
        const alice = keyring.addFromUri('//Alice', {
            name: 'Alice default',
        });
        // account that has tokens both on main net and dusty
        const bob =
            (plasmEndpoint as plasmUtils.PlasmNetwork) === plasmUtils.PlasmNetwork.Dusty
                ? 'Wh2nf6F5ZNJguoQu22Z361xo6VFqX1Y2BuQMcJBSJxERh5E'
                : '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

        // only make a transfer if it's connected to a local node
        if ((plasmEndpoint as plasmUtils.PlasmNetwork) === plasmUtils.PlasmNetwork.Local) {
            // Create a extrinsic, transferring 12345 units to Bob
            const transfer = api.tx.balances.transfer(bob, '100000000000');

            // Sign and send the transaction using our account
            await transfer.signAndSend(alice, ({ status }) => {
                console.log('tx status', status.toHuman());
            });
        }
        const { data: balance } = await api.query.system.account(bob);

        console.log(`has balance of ${balance.free}`);
        expect(new BN('100000000000').lte(balance.free.toBn())).toBeTruthy();
    });

    it('checks lockdrop parameter conversion', () => {
        const param = plasmUtils.structToLockdrop(ropstenLock as any);
        expect(param.duration.toString()).toEqual(ropstenLock.get('duration')?.toString());

        const param2 = plasmUtils.structToLockdrop(btcTestnet3Lock as any);
        expect(param2.transactionHash.toString()).toEqual(btcTestnet3Lock.get('transactionHash')?.toString());
    });

    it(
        'lock/claim Ropsten transactions',
        async () => {
            const nonce = plasmUtils.claimPowNonce(ropstenLock.hash);
            console.log('claim nonce: ' + polkadotUtil.u8aToHex(nonce));
            console.log('claim ID: ' + ropstenLock.hash.toString());

            const claimRequestTx = api.tx.plasmLockdrop.request(ropstenLock.toU8a(), nonce);
            await claimRequestTx.send();

            //const claimData = await api.query.plasmLockdrop.claims(ropstenLock.hash);
            const claimData = await plasmUtils.getClaimStatus(api, ropstenLock.hash);
            const claimAmount = new BN(claimData!.amount.toString());
            console.log('Receiving amount: ' + claimAmount.toString());
            expect(claimData!.params.value.toString()).toEqual(ropstenLock.get('value')?.toString());
        },
        200 * 1000,
    );

    it(
        'lock/claim Ropsten transactions with plasm utils',
        async () => {
            const nonce = plasmUtils.claimPowNonce(sampleLock.hash);
            console.log('claim nonce: ' + polkadotUtil.u8aToHex(nonce));
            console.log('claim ID: ' + sampleLock.hash.toString());

            await plasmUtils.sendLockClaimRequest(api, sampleLock as any, nonce);

            const claimData = await plasmUtils.getClaimStatus(api, sampleLock.hash);
            const claimAmount = new BN(claimData!.amount.toString());
            console.log('Receiving amount: ' + claimAmount.toString());
            expect(claimData!.params.value.toString()).toEqual(sampleLock.get('value')?.toString());
        },
        200 * 1000,
    );

    // it(
    //     'lock/claim BTC testnet3 transactions',
    //     async () => {
    //         // const nonce = plasmUtils.claimPowNonce(btcTestnet3Lock.hash);
    //         // console.log('claim nonce: ' + polkadotUtil.u8aToHex(nonce));
    //         // console.log('claim ID: ' + ropstenLock.hash.toString());

    //         // const claimRequestTx = api.tx.plasmLockdrop.request(btcTestnet3Lock.toU8a(), nonce);
    //         // await claimRequestTx.send();

    //         //const claimData = await api.query.plasmLockdrop.claims(btcTestnet3Lock.hash);
    //         const claimData = await plasmUtils.getClaimStatus(api, btcTestnet3Lock.hash);
    //         const claimAmount = new BN(claimData!.amount.toString());
    //         console.log('Receiving amount: ' + claimAmount.toString());
    //         expect(claimData!.params.value.toString()).toEqual(btcTestnet3Lock.get('value')?.toString());
    //     },
    //     200 * 1000,
    // );

    it('checks lockdrop voting requirements', async () => {
        const _voteThreshold = Number.parseInt((await api.query.plasmLockdrop.voteThreshold()).toString());
        const _positiveVotes = Number.parseInt((await api.query.plasmLockdrop.positiveVotes()).toString());

        expect(_voteThreshold).toEqual(4);
        expect(_positiveVotes).toEqual(4);
    });
});

describe('real-time lockdrop claim hash tests', () => {
    it('checks claim request hashing', () => {
        expect(sampleLock.hash.toHex() === sampleClaimId).toEqual(true);
    });

    it('performs a simple PoW security check', () => {
        const nonce = plasmUtils.claimPowNonce(sampleLock.hash);
        const powData = polkadotUtil.u8aConcat(sampleClaimId, nonce);
        const powHash = polkadotCryptoUtil.blake2AsU8a(powData);
        expect(powHash[0]).toEqual(0);
    });
});
