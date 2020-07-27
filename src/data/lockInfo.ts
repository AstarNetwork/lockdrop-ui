import { OptionItem, LockMenu } from '../types/LockdropModels';
import moment from 'moment';
import ethLogo from '../resources/ethereum_logo.svg';
import btcLogo from '../resources/bitcoin_logo.svg';
import Lockdrop from '../contracts/Lockdrop.json';

/**
 * the time zone is set to UTC as default
 * lockdrop starts from 1584230400 epoch time
 */
export const firstLockdropStart = moment.utc('2020-03-15 00:00:00');

/**
 * the 1st lockdrop will last for 30 days
 * lockdrop ends in 1586822400
 */
export const firstLockdropEnd = moment.utc('2020-04-14 00:00:00');

// todo: the second lockdrop dates are just a temporary value
export const secondLockdropStart = moment.utc('2020-08-10 00:00:00');

export const secondLockdropEnd = moment.utc('2020-09-10 00:00:00');

//todo: add other contract addresses when ready
export const lockdropContracts = {
    firstLock: {
        main: '0x458DaBf1Eff8fCdfbF0896A6Bd1F457c01E2FfD6',
        ropsten: '0xEEd84A89675342fB04faFE06F7BB176fE35Cb168',
        private: Lockdrop.networks[5777].address,
    },
    secondLock: {
        main: '0x',
        ropsten: '0x69e7eb3ab94a10e4f408d842b287c70aa0d11649',
        private: Lockdrop.networks[5777].address,
    },
    thirdLock: { main: '0x', ropsten: '0x', private: Lockdrop.networks[5777].address },
};

/**
 * used to define the content of the dropdown menu
 */
export const ethDurations: OptionItem[] = [
    { label: '30 Days', value: 30, rate: 24 },
    { label: '100 Days', value: 100, rate: 100 },
    { label: '300 Days', value: 300, rate: 360 },
    { label: '1000 Days', value: 1000, rate: 1600 },
];

/**
 * used to define the content of the dropdown menu
 */
export const ethDustyDurations: OptionItem[] = [
    { label: '3 Days', value: 3, rate: 24 },
    { label: '10 Days', value: 10, rate: 100 },
    { label: '30 Days', value: 30, rate: 360 },
    { label: '100 Days', value: 100, rate: 1600 },
];

/**
 * BTC lockdrop does not support 1000 days lock due to CSV lock scheme
 */
export const btcDurations: OptionItem[] = [
    { label: '30 Days', value: 30, rate: 24 },
    { label: '100 Days', value: 100, rate: 100 },
    { label: '300 Days', value: 300, rate: 360 },
];

/**
 * BTC lockdrop for Dusty network. The lock days are much shorter
 */
export const btcDustyDurations: OptionItem[] = [
    { label: '3 Days', value: 3, rate: 24 },
    { label: '10 Days', value: 10, rate: 100 },
    { label: '30 Days', value: 30, rate: 360 },
];

// /**
//  * the token increase rate for lock durations
//  */
// export const rates = [
//     { key: 30, value: 24 },
//     { key: 100, value: 100 },
//     { key: 300, value: 360 },
//     { key: 1000, value: 1600 },
// ];

// /**
//  * the token increase rate for Dusty lock durations
//  */
// export const dustyRates = [
//     { key: 3, value: 24 },
//     { key: 10, value: 100 },
//     { key: 30, value: 360 },
//     { key: 100, value: 1600 },
// ];

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
        //uri: '/lock-form/first',
        icon: ethLogo,
        startDate: secondLockdropStart,
        endDate: secondLockdropEnd,
        disabled: true,
    },
    {
        title: 'BTC Lock',
        uri: '/lock-form/first',
        icon: btcLogo,
        startDate: secondLockdropStart,
        endDate: secondLockdropEnd,
        disabled: true,
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
    {
        title: 'BTC Lock',
        //uri: '/lock-form/dusty-btc',
        icon: btcLogo,
        startDate: firstLockdropStart,
        endDate: firstLockdropEnd,
        disabled: true,
    },
];
