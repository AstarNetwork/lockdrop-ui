/* eslint-disable @typescript-eslint/camelcase */
//import { generatePlmAddress } from '../helpers/lockdrop/EthereumLockdrop';
import EthCrypto from 'eth-crypto';
import * as polkadotUtil from '@polkadot/util-crypto';
import { createDustyPlasmInstance } from '../helpers/plasmUtils';

const ethPubKey =
    'a27c1e09c563b1221636c7f69690a6e4d41e9c79d38518d00d5f6d3fb5d7a35407caff68e13fcd845646dc848e0649417b89acf1af435bd18f1ab2fcf20e2e61';
const plasmPubKey = '215a9a3e38ba3dcaf8120046e3f4b385b25016575ab8564973edfdb64528493b';

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
    it('checks plasm session duration', async () => {
        // establish a connection with the node
        const api = await createDustyPlasmInstance();
        const sessionDuration = api.consts.babe.epochDuration.toNumber();
        expect(sessionDuration).toEqual(1440);
    });

    // it('tests real-time lockdrop types', async () => {
    //     const api = await createDustyPlasmInstance();
    // });
});
