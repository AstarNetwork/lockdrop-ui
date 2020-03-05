import BN from 'bn.js';

export interface LockInput {
    duration: number;
    amount: BN;
    affiliation: string;
    txMethod?: string;
    rate: number;
}
