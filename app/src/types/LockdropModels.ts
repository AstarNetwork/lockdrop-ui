import BN from 'bn.js';
import { Moment } from 'moment';
import { u8, u64, u128, U8aFixed } from '@polkadot/types';
import { H256 } from '@polkadot/types/interfaces';

/**
 * lock contract parameter
 */
export interface LockInput {
    duration: number;
    amount: BN;
    affiliation: string;
    rate: number;
}

/**
 * defines the method for creating a BTC transaction
 */
export enum BtcWalletType {
    Trezor,
    Ledger,
    Raw,
    None,
}

/**
 * defines the Bitcoin network
 */
export enum BtcNetwork {
    TestNet,
    MainNet,
}

export interface UnspentTx {
    value: number;
    txId: string;
    vout: number;
    address?: string;
    height?: number;
}

export interface LockMenu {
    uri?: string;
    icon?: string;
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
    Dusty,
    Third,
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

/**
 * used for real-time lockdrop parameter
 * this data is used to communicate with Substrate
 */
export interface Lockdrop {
    type: u8; //u8
    transactionHash: H256; //H256
    publicKey: U8aFixed; // [u8; 33]
    duration: u64; // u64
    value: u128; // u128
}

export interface Claim {
    params: Lockdrop;
    approve: BN; // AuthorityVote
    decline: BN; // AuthorityVote
    amount: u128; // u128
    complete: boolean;
}
