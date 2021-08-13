import { OptionItem } from '../types/LockdropModels';
import moment from 'moment';

import Lockdrop from '../contracts/Lockdrop.json';

const LOCKDROP_DURATION = 30; // days

/**
 * the time zone is set to UTC as default
 * lockdrop starts from 1584230400 epoch time
 */
export const firstLockdropStart = moment.unix(1584230400);
export const firstLockdropEnd = firstLockdropStart.clone().add(LOCKDROP_DURATION, 'days');

/**
 * the time zone is set to UTC as default
 * lockdrop starts from 1598832000 epoch time
 */
export const secondLockdropStart = moment.unix(1598832000);
export const secondLockdropEnd = secondLockdropStart.clone().add(LOCKDROP_DURATION, 'days');

export interface LockdropContract {
    type: 'main' | 'private';
    address: string;
    blockHeight: number;
}

export const firstLockContract: LockdropContract[] = [
    {
        type: 'main',
        address: '0x458DaBf1Eff8fCdfbF0896A6Bd1F457c01E2FfD6',
        blockHeight: 9662816,
    },
    { type: 'private', address: Lockdrop.networks[5777].address, blockHeight: 0 },
];

export const secondLockContract: LockdropContract[] = [
    {
        type: 'main',
        address: '0xa4803f17607B7cDC3dC579083d9a14089E87502b',
        blockHeight: 10714638,
    },
    { type: 'private', address: Lockdrop.networks[5777].address, blockHeight: 0 },
];

/**
 * used to define the content of the dropdown menu
 */
export const ethDurations: OptionItem[] = [
    { label: '30 Days', value: 30, rate: 24 },
    { label: '100 Days', value: 100, rate: 100 },
    { label: '300 Days', value: 300, rate: 360 },
    { label: '1000 Days', value: 1000, rate: 1600 },
];
