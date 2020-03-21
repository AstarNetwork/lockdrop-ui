import BN from 'bn.js';

export interface LockInput {
    duration: number;
    amount: BN;
    affiliation: string;
    txMethod?: string;
    rate: number;
}

export interface LockEvent {
    eth: BN;
    duration: number;
    lock: string;
    introducer: string;
    blockNo: number;
    timestamp: string; // in Unix epoch
}
