import BN from 'bn.js';
import { Moment } from 'moment';

export interface LockInput {
    duration: number;
    amount: BN;
    affiliation: string;
    rate: number;
}

export enum BtcWalletType {
    Trezor,
    Ledger,
    Raw,
    None,
}

export interface UnspentTx {
    value: number;
    txId: string;
    vout: number;
    address?: string;
    height?: number;
}

export interface LockMenu {
    uri: string;
    icon: string;
    title: string;
    startDate: Moment;
    endDate: Moment;
    disabled?: boolean;
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
    blockHash: string;
    transactionHash: string;
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

// used for real-time lockdrop parameter
// we use the snake case because substrate has the read it
export interface Lockdrop {
    type: number; //u8
    transaction_hash: Uint8Array; //H256
    public_key: Uint8Array; // [u8; 33]
    duration: BN; // u64
    value: BN; // u128
}

export interface Claim {
    params: Lockdrop;
    approve: BN; // AuthorityVote
    decline: BN; // AuthorityVote
    amount: BN; // u128
    complete: boolean;
}
