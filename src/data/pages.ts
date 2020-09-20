import ethLogo from '../resources/ethereum_logo.svg';
import { LockMenu } from '../types/LockdropModels';
import { firstLockdropStart, firstLockdropEnd, secondLockdropStart, secondLockdropEnd } from './lockInfo';

export const firstLock: LockMenu[] = [
    {
        title: 'ETH Lock',
        uri: '/lock-form/first',
        icon: ethLogo,
        startDate: firstLockdropStart,
        endDate: firstLockdropEnd,
    },
];

export const secondLock: LockMenu[] = [
    {
        title: 'ETH Lock',
        uri: '/lock-form/second-eth',
        icon: ethLogo,
        startDate: secondLockdropStart,
        endDate: secondLockdropEnd,
    },
];

export const dustyLock: LockMenu[] = [
    {
        title: 'ETH Lock',
        uri: '/lock-form/dusty-eth',
        icon: ethLogo,
        startDate: firstLockdropStart,
        endDate: firstLockdropEnd,
    },
];
