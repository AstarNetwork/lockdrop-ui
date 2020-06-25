/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import EthCrypto from 'eth-crypto';
import * as polkadotCryptoUtil from '@polkadot/util-crypto';
import * as polkadotUtil from '@polkadot/util';
import { createDustyPlasmInstance, PlasmNetwork, claimPowNonce } from '../helpers/plasmUtils';
import { ApiPromise, Keyring } from '@polkadot/api';
import BN from 'bn.js';
import { Struct, TypeRegistry, u64, u128, U8aFixed, u8 } from '@polkadot/types';

const registry = new TypeRegistry();

const ethPubKey =
    'a27c1e09c563b1221636c7f69690a6e4d41e9c79d38518d00d5f6d3fb5d7a35407caff68e13fcd845646dc848e0649417b89acf1af435bd18f1ab2fcf20e2e61';
const plasmPubKey = '215a9a3e38ba3dcaf8120046e3f4b385b25016575ab8564973edfdb64528493b';

const sampleClaimId = '0xa94710e9db798a7d1e977b9f748ae802031eee2400a77600c526158892cd93d8';

const sampleLock = new Struct(
    registry,
    {
        type: u8,
        transactionHash: 'H256',
        publicKey: U8aFixed, // [u8; 33]
        duration: u64,
        value: u128,
    },
    {
        type: '1',
        transactionHash: '0x6c4364b2f5a847ffc69f787a0894191b75aa278a95020f02e4753c76119324e0',
        publicKey: new U8aFixed(
            registry,
            '0x039360c9cbbede9ee771a55581d4a53cbcc4640953169549993a3b0e6ec7984061',
            33 * 8,
        ),
        duration: new u64(registry, '2592000'),
        value: new u128(registry, '100000000000000000'),
    },
);

// converts a given hex string into Uint8Array
const toByteArray = (hexString: string) => {
    const result = [];
    for (let i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(result);
};

// blake2 hashes any given object
const hashObject = (object: object) => {
    const objVal = Object.values(object);
    let serial = '';

    objVal.map(i => {
        if (typeof i === 'string') {
            let hexVal = new Uint8Array();

            if (i.match('0x')) {
                // convert hex string to u8 array
                hexVal = toByteArray(i);
            } else {
                // convert string number to hex and then u8 array
                hexVal = toByteArray('0x' + new BN(i).toString('hex'));
            }

            serial += polkadotUtil.u8aToHex(hexVal).replace('0x', '');
        } else {
            throw new Error('object value must be string');
        }
    });

    return polkadotCryptoUtil.blake2AsHex(serial, 256);
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
    // change this to either local of dusty to switch networks and tests
    const plasmEndpoint = PlasmNetwork.Local;

    let api: ApiPromise;
    const keyring = new Keyring({
        type: 'sr25519',
    });

    beforeEach(async () => {
        api = await createDustyPlasmInstance(plasmEndpoint);
    });

    it('checks plasm constants', async () => {
        const sessionDuration = api.consts.babe.epochDuration.toNumber();
        const plasmRewards = (api.consts as any).plasmRewards.sessionsPerEra.toNumber();
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
            (plasmEndpoint as PlasmNetwork) === PlasmNetwork.Dusty
                ? 'Wh2nf6F5ZNJguoQu22Z361xo6VFqX1Y2BuQMcJBSJxERh5E'
                : '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

        // only make a transfer if it's connected to a local node
        if ((plasmEndpoint as PlasmNetwork) === PlasmNetwork.Local) {
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
    // dusty does not implement the lock claim module yet
    if ((plasmEndpoint as PlasmNetwork) === PlasmNetwork.Local) {
        it('send lock claim transaction', async () => {
            const nonce = claimPowNonce(sampleLock.hash.toU8a());

            const claimRequestTx = await (api.tx as any).plasmLockdrop.request(
                sampleLock,
                polkadotUtil.u8aToHex(nonce),
            );

            console.log('claim nonce: ' + polkadotUtil.u8aToHex(nonce));

            await claimRequestTx.send();
        });

        it('queries plasm claim request event', async () => {
            const claimData = await (api.query as any).plasmLockdrop.claims(sampleLock.hash);

            const claimAmount = new BN(claimData.amount.toString());

            console.log('Receiving amount: ' + claimAmount.toString());
            //expect(claimData.params.value.toString()).toEqual(sampleLock.value.toString());
        });
    }
});

describe('real-time lockdrop claim hash tests', () => {
    it('checks claim request hashing', () => {
        expect(sampleLock.hash.toHex() === sampleClaimId).toEqual(true);
    });

    it('performs a simple PoW security check', () => {
        const nonce = claimPowNonce(sampleLock.hash);
        const powData = polkadotUtil.u8aConcat(sampleClaimId, nonce);
        const powHash = polkadotCryptoUtil.blake2AsU8a(powData);
        expect(powHash[0]).toEqual(0);
    });
});
