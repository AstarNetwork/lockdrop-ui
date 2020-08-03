/* eslint-disable @typescript-eslint/no-namespace */

// types generated from http://json2ts.com/
export declare namespace BlockStreamApi {
    export interface Prevout {
        scriptpubkey: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        scriptpubkey_address: string;
        value: number;
    }

    export interface Vin {
        txid: string;
        vout: number;
        prevout: Prevout;
        scriptsig?: string;
        scriptsig_asm?: string;
        is_coinbase: boolean;
        sequence: number;
    }

    export interface Vout {
        scriptpubkey: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        scriptpubkey_address: string;
        value: number;
    }

    export interface Status {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    }

    export interface Transaction {
        txid: string;
        version: number;
        locktime: number;
        vin: Vin[];
        vout: Vout[];
        size: number;
        weight: number;
        fee: number;
        status: Status;
    }
}
