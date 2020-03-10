import { defaultAddress } from '../helpers/lockdrop/EthereumLockdrop';

//todo: currently this is just a mock list. Replace this with actual addresses from the affiliation form
export const validEthAddressList = [
    '0x01734005354d569716291cD1CFbc67f3f56a0b6F',
    '0x56D81369b695c587995e24f59d258Dd926140085',
    defaultAddress,
];

export function isRegisteredEthAddress(introducer: string) {
    return validEthAddressList.includes(introducer);
}
