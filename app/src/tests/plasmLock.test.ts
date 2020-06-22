/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
//import { generatePlmAddress } from '../helpers/lockdrop/EthereumLockdrop';
import EthCrypto from 'eth-crypto';
import * as polkadotUtil from '@polkadot/util-crypto';
import { createDustyPlasmInstance, PlasmNetwork, claimPowNonce, BITMASK } from '../helpers/plasmUtils';
import { ApiPromise, Keyring } from '@polkadot/api';
import BN from 'bn.js';

function toHexString(byteArray: Uint8Array) {
    return Array.prototype.map
        .call(byteArray, function(byte) {
            return ('0' + (byte & 0xff).toString(16)).slice(-2);
        })
        .join('');
}

function toByteArray(hexString: string) {
    return Uint8Array.from(Buffer.from(hexString, 'hex'));
}

const ethPubKey =
    'a27c1e09c563b1221636c7f69690a6e4d41e9c79d38518d00d5f6d3fb5d7a35407caff68e13fcd845646dc848e0649417b89acf1af435bd18f1ab2fcf20e2e61';
const plasmPubKey = '215a9a3e38ba3dcaf8120046e3f4b385b25016575ab8564973edfdb64528493b';

const sampleClaimId = '0xe691bbdbd57db92443d39897454b3cef8351450004b5258d03bf8fdcffb3748c';

const sampleLock = {
    type: '1',
    transaction_hash: '0x6c4364b2f5a847ffc69f787a0894191b75aa278a95020f02e4753c76119324e0',
    public_key: '0x039360c9cbbede9ee771a55581d4a53cbcc4640953169549993a3b0e6ec7984061',
    duration: '2592000',
    value: new BN('100000000000000000'),
};

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
    const keyring = new Keyring({
        type: 'sr25519',
    });

    beforeEach(async () => {
        api = await createDustyPlasmInstance(PlasmNetwork.Local);
    });

    it('checks plasm constants', async () => {
        const sessionDuration = api.consts.babe.epochDuration.toNumber();
        const plasmRewards = (api.consts as any).plasmRewards.sessionsPerEra.toNumber();
        expect(sessionDuration).toEqual(1440);
        expect(plasmRewards).toEqual(6);
    });

    it('queries Alice account balance and make a transaction', async () => {
        // the alice wallet from a dev chain
        const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });
        const bob = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

        const { data: balance } = await api.query.system.account(alice.address);
        //console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);

        // expect the Alice wallet to have more than 0 tokens
        expect(balance.free.toBn() > new BN(0)).toBeTruthy();

        // Create a extrinsic, transferring 12345 units to Bob
        const transfer = api.tx.balances.transfer(bob, 12345);
        //await transfer.send();
        // Sign and send the transaction using our account
        await transfer.signAndSend(alice, ({ status }) => {
            console.log('tx status', status.toHuman());
        });
    });

    it('send lock claim transaction', async () => {
        const nonce = claimPowNonce(sampleClaimId);

        const claimRequestTx = await (api.tx as any).plasmLockdrop.request(sampleLock, nonce);

        await claimRequestTx.send();
    });

    it('queries plasm claim request event', async () => {
        const claimData = await (api.query as any).plasmLockdrop.claims(sampleClaimId);

        console.log('Receiving amount: ' + claimData.amount.toString());
        //expect(claimData.params.value.toString()).toEqual(sampleLock.value.toString());
    });
});

describe('real-time lockdrop claim hash tests', () => {
    it('checks claim request hashing', () => {
        const claimData = JSON.stringify(sampleLock);
        const claimId = polkadotUtil.blake2AsHex(claimData, 256);
        expect(claimId).toEqual(sampleClaimId);
    });

    it('performs a simple PoW security check', () => {
        const nonce = claimPowNonce(sampleClaimId);
        console.log('nonce: ' + nonce);

        const powByte = polkadotUtil.blake2AsU8a(sampleClaimId + nonce)[0];

        expect(powByte & BITMASK).toEqual(0);
    });
});
