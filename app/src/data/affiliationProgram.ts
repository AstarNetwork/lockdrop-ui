// the default introducer address when none is provided by the user
export const defaultAddress = '0x0000000000000000000000000000000000000000';

export const affiliationRate = 0.01;

const firstEthIntroducer = [
    '0xd8de1f6764e442b8763d313722e9eaee3779707e',
    '0x1d32750e8a03443f008236f7c344fc84821cf690',
    '0xa5a6d551ab33c3920848844b3fe3b27591df8f10',
    '0xd8068f813c45c88cebb02cbc0f91f95626ec9a34',
    '0x45ee0a0db0e775aecbebb300ccfc6486690b3287',
    '0xd419d53817e1daa7b2f72e51707774f3ff0a54a3',
    '0x1080355c93a1b4c0dd3c340eed4f7e514c583077',
    '0x0013aa2fb5ec916660b38f1d53d4fc9bf8ef8a84',
    '0x78ce6849d00c2f22aec93d29144fc68366cf0c62',
    '0x60dc4b3d8e8d2c5449186270f385a56a21bb82c3',
    '0x380566185c87ab93ca4edd474cf6998b5fc4153e',
    '0x6a61dc52015945dfc6cd0c42f94a722d5022e3d1',
    '0x520e74218a9fd5563855f11d204810281a833e0f',
    '0x27c72e4bd23c910218d8f06c4a1742e06657c874',
    '0xd307ff28710b7a4587200c5ba4c67648c1f24045',
    '0x9498db340a3ecab7bb0973ee36e95e58c8e58a41',
    '0xe552821ee85284249c71d4abfc4437992ed2fb93',
    '0xc78a748dccbd806ae782eb3b8590ae7d162e5a90',
    '0x20edd77ea8582f4a2400d3c0d53154a74a1ca887',
    '0xeef2e4a5f6a01d5fb89f38211fb4e6a8702d33b6',
    '0x531c2607862de00604f600cff6be9cb312467570',
    '0xf22b286fda7369255376742f360ffcee4e1fbd42',
    '0xb35e0bfec9facd8f2dcc0e43e68350d5e7baa82f',
    '0x7b4d4ba1070c4562c568fed6280c800a68fa5427',
    '0x81042f7f99a86d3981308e72feb36bd791c31920',
    '0xb98df9f7cdc3a983081cefa1cd94aed4e936f1a9',
    '0x5b6c1f8838b9abf16c0383b7e4f3c5a750707af2',
    '0x711b3ca2cc9d5a827f83d5ceafcb0925f2fb82b3',
    '0x8e7fcc7a17f00f0f5f85f2d5964a581d0813c8a6',
    '0x6b5e2758bdb9ed798acbfd64104c1deaf09cd24b',
    '0x55763d6db54736084c1b8d010aa1d99f0dc6d07c',
    '0xfadf736b86f09f2d07d2b655cfc848fe215140d4',
    '0x9f4f9e15a4a963a9a3885979cc64b326dcaa18a8',
    '0x0def9b4811e4c4e9da5acf82d421c97b5e9c152f',
];

const secondEthIntroducer = ['add Ethereum addresses'];

export const validEthAddressList = [...firstEthIntroducer, ...secondEthIntroducer, defaultAddress];

export function isRegisteredEthAddress(introducer: string) {
    return validEthAddressList.includes(introducer.toLowerCase());
}
