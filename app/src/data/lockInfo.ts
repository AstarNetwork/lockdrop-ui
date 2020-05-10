import { OptionItem } from '../models/LockdropModels';
import moment from 'moment';

// the time zone is set to UTC as default
// lockdrop starts from 1584230400 epoch time
export const firstLockdropStart = moment.utc('2020-03-15 00:00:00');
// the 1st lockdrop will last for 30 days
// lockdrop ends in 1586822400
export const firstLockdropEnd = moment.utc('2020-04-14 00:00:00');

// used to define the content of the dropdown menu
export const durations: OptionItem[] = [
    { label: '30 Days', value: 30 },
    { label: '100 Days', value: 100 },
    { label: '300 Days', value: 300 },
    { label: '1000 Days', value: 1000 },
];

// the token increase rate for lock durations
export const rates = [
    { key: 30, value: 24 },
    { key: 100, value: 100 },
    { key: 300, value: 360 },
    { key: 1000, value: 1600 },
];
