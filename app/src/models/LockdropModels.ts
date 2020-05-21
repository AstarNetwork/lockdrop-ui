import BN from 'bn.js';

export interface LockInput {
    duration: number;
    amount: BN;
    affiliation: string;
    rate: number;
}

export interface TimeFormat {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export enum LockSeason {
    First,
    Second,
}

export interface LockEvent {
    eth: BN; // this uses BN.js instead of BigNumber.js because that is what eth helper uses
    duration: number;
    lock: string; // lock address
    introducer: string;
    blockNo: number;
    timestamp: string; // in Unix epoch
    lockOwner: string; // locker's address
    blockHash: any;
}

// option data is the type that is going to be passed to the component
export interface OptionData {
    dataSets: OptionItem[];
    onChoose: Function;
}

// option item type is used to provide the data for dropdown items
export interface OptionItem {
    label: string; // the dropdown display label
    value: number | string; // dropdown select return value
}
