//import { generatePlmAddress } from '../helpers/lockdrop/EthereumLockdrop';
import Message from 'bitcore-message';
import { instantiateSecp256k1 } from 'bitcoin-ts';
import * as sha256 from 'fast-sha256';

// constants
//test set 1
const btcAddr = '1En7wYxwUiuFfma1Pu3N6d5gopRPvWoj4q';
const msg = 'aas';
const sig = 'IAqCpjxYFTl/OtYzLYb8VVYgyspmiEj43GQoG8R10hLKVOWF6YNXdBlx2U08HEG+oyyu3eZGoYoAfFcRFcQ+dBM=';

//test set 2
const privKey = 'KwdnN71f76aF2nXjTNw3phitaQhvLAxkx6uRndwmmXzRR9hgDB3y';
const addr2 = '17L3qWGDUBGN5V8d9yqXgJqiwwnEugL1UJ';

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

// tests
it('verifies the signature from address', () => {
    //expect(verify(msg, sig, recover(msg, sig))).toEqual(true);

    const verified = Message(msg).verify(btcAddr, sig);
    expect(verified).toEqual(true);
});

it('recovers the public key from the signature', async () => {
    const secp256k1 = await instantiateSecp256k1();
    const hashedMsg = sha256.hash(Buffer.from(msg, 'base64'));
    const sigToByte = toByteArray(sig);

    const pubKey = secp256k1.recoverPublicKeyUncompressed(sigToByte, 1, hashedMsg);
    console.log(toHexString(pubKey));
    // ensure correct pub key format
    expect(toHexString(pubKey).length == 130).toEqual(true);
    // verify message with the public key
    expect(secp256k1.verifySignatureCompact(sigToByte, pubKey, hashedMsg)).toEqual(true);
});
