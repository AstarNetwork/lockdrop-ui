/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
//import { generatePlmAddress } from '../helpers/lockdrop/EthereumLockdrop';
import EthCrypto from 'eth-crypto';
import * as polkadotUtil from '@polkadot/util-crypto';
import { createDustyPlasmInstance, PlasmNetwork } from '../helpers/plasmUtils';
import { ApiPromise, Keyring } from '@polkadot/api';
import BN from 'bn.js';

const ethPubKey =
    'a27c1e09c563b1221636c7f69690a6e4d41e9c79d38518d00d5f6d3fb5d7a35407caff68e13fcd845646dc848e0649417b89acf1af435bd18f1ab2fcf20e2e61';
const plasmPubKey = '215a9a3e38ba3dcaf8120046e3f4b385b25016575ab8564973edfdb64528493b';

const sampleLock = {
    type: '1',
    txHash: '0x6c4364b2f5a847ffc69f787a0894191b75aa278a95020f02e4753c76119324e0',
    pubKey: '0x039360c9cbbede9ee771a55581d4a53cbcc4640953169549993a3b0e6ec7984061',
    duration: '2592000',
    lockValue: new BN('100000000000000000'),
};

function toHexString(byteArray: Uint8Array) {
    return Array.prototype.map
        .call(byteArray, function(byte) {
            return ('0' + (byte & 0xff).toString(16)).slice(-2);
        })
        .join('');
}

function toByteArray(hexString: string) {
    const result = [];
    for (let i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(result);
}

describe('Plasm ECDSA address tests', () => {
    it('checks compressed ETH pub key length', () => {
        expect(EthCrypto.publicKey.compress(ethPubKey).length).toEqual(66);
    });

    it('checks blake hashed pub key', () => {
        const compressedPubKey = EthCrypto.publicKey.compress(ethPubKey);
        const blakeHashed = polkadotUtil.blake2AsU8a(toByteArray(compressedPubKey), 256);
        expect(toHexString(blakeHashed)).toEqual(plasmPubKey);
    });
});

describe('Plasm lockdrop RPC tests', () => {
    // initialize a connection with the blockchain
    let api: ApiPromise;

    beforeEach(async () => {
        api = await createDustyPlasmInstance(PlasmNetwork.Local);
    });

    it('checks plasm constants', async () => {
        const sessionDuration = api.consts.babe.epochDuration.toNumber();
        const plasmRewards = (api.consts as any).plasmRewards.sessionsPerEra.toNumber();
        expect(sessionDuration).toEqual(1440);
        expect(plasmRewards).toEqual(6);
    });

    it('obtain plasm untreated era value', async () => {
        const totalBal = await (api.query as any).plasmValidator.untreatedEra();
        console.log(totalBal.toString());
        expect(totalBal).toBeTruthy();
    });

    it('queries Alice account balance and make a transaction', async () => {
        const keyring = new Keyring({
            type: 'sr25519',
        });
        // the alice wallet from a dev chain
        const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });
        const bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

        const { data: balance } = await api.query.system.account(alice.address);
        //console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);

        // expect the Alice wallet to have more than 0 tokens
        expect(balance.free.toBn() > new BN(0)).toBeTruthy();

        // Create a extrinsic, transferring 12345 units to Bob
        const transfer = api.tx.balances.transfer(bob, 12345);

        // Sign and send the transaction using our account
        const hash = await transfer.signAndSend(alice);
    });

    it('send lock claim transaction', async () => {
        const keyring = new Keyring({
            type: 'sr25519',
        });

        // the alice wallet from a dev chain
        const alice = keyring.addFromUri('//Alice', {
            name: 'Alice default',
        });

        const claimRequestTx = await (api.tx as any).plasmLockdrop.request(sampleLock);

        const hash = await claimRequestTx.signAndSend(alice);

        expect(hash.toHex()).toBeTruthy();
    });
    //todo: create lock claim ID https://docs.plasmnet.io/workshop-and-tutorial/real-time-lockdrop

    it('queries plasm events', () => {
        const claimId = polkadotUtil.blake2AsU8a(toByteArray(JSON.stringify(sampleLock, null, 0)), 256);
        console.log(toHexString(claimId));
    });
});
