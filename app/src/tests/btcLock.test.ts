import { PrivateKey, Message } from 'bitcore-lib';
import eccrypto from 'eccrypto';
import wif from 'wif';

const MESSAGE = 'plasm network btc lock';

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

    it('sign message with private key', async () => {
        const signature = new Message(MESSAGE).sign(new PrivateKey(testSet1.privateKey));

        expect(new Message(MESSAGE).verify(testSet1.address, signature)).toEqual(true);
    });

    it('recovers the public key from the signature', async () => {
        const hashedMessage = new Message(MESSAGE);

        const sig = hashedMessage.sign(new PrivateKey(testSet2.privateKey));

        const pubKey = hashedMessage.recoverPublicKey(testSet2.address, sig);
        //console.log(pubKey);
        expect(pubKey).toEqual(testSet2.publicKey);
    });
});
