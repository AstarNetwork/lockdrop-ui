import BN from 'bn.js';
import { Moment } from 'moment';
import { u64, u128, U8aFixed, BTreeSet } from '@polkadot/types';
import { H256, AuthorityId } from '@polkadot/types/interfaces';

/**
 * lock contract parameter
 */
export interface LockInput {
    duration: number; // in days
    amount: BN; // in ETH
    affiliation: string; // Ethereum address
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

/**
 * The lockdrop lock token type. This is used for the real-time lockdrop module
 */
export enum LockdropType {
    Bitcoin,
    Ethereum,
}

export interface LockEvent {
    eth: BN; // this uses BN.js instead of BigNumber.js because that is what eth helper uses
    duration: number; // in Unix epoch seconds
    lock: string; // lock address
    introducer: string;
    blockNo: number;
    timestamp: string; // in Unix epoch seconds
    lockOwner: string; // locker's address
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
    value: number; // dropdown select return value
    rate: number;
}

/**
 * used for real-time lockdrop parameter
 * this data is used to communicate with Substrate
 */
export interface Lockdrop {
    type: LockdropType;
    transactionHash: H256; //H256
    publicKey: U8aFixed; // [u8; 33]
    duration: u64; // u64
    value: u128; // u128
}

export interface Claim {
    params: Lockdrop;
    approve: BTreeSet<AuthorityId>;
    decline: BTreeSet<AuthorityId>;
    amount: u128; // u128
    complete: boolean;
}

export interface HwSigner {
    publicKey: Buffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    network?: any;
    sign(hash: Buffer, lowR?: boolean): Buffer | Promise<Buffer>;
    getPublicKey?(): Buffer;
}
