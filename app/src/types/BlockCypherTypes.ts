/* eslint-disable @typescript-eslint/no-namespace */

// types generated from http://json2ts.com/
export declare namespace BlockCypherApi {
    export interface Input {
        prev_hash: string;
        output_index: number;
        script: string;
        output_value: number;
        sequence: number;
        addresses: string[];
        script_type: string;
        age: number;
    }

    export interface Output {
        value: number;
        script: string;
        spent_by: string;
        addresses: string[];
        script_type: string;
    }

    export interface Txref {
        tx_hash: string;
        block_height: number;
        tx_input_n: number;
        tx_output_n: number;
        value: number;
        ref_balance: number;
        confirmations: number;
        confirmed: Date;
        double_spend: boolean;
        spent?: boolean;
        spent_by: string;
    }

    export interface BtcAddress {
        address: string;
        total_received: number;
        total_sent: number;
        balance: number;
        unconfirmed_balance: number;
        final_balance: number;
        n_tx: number;
        unconfirmed_n_tx: number;
        final_n_tx: number;
        txrefs: Txref[];
        tx_url: string;
    }

    export interface BtcTxHash {
        block_hash: string;
        block_height: number;
        block_index: number;
        hash: string;
        addresses: string[];
        total: number;
        fees: number;
        size: number;
        preference: string;
        relayed_by: string;
        confirmed: Date;
        received: Date;
        ver: number;
        lock_time: number;
        double_spend: boolean;
        vin_sz: number;
        vout_sz: number;
        confirmations: number;
        confidence: number;
        inputs: Input[];
        outputs: Output[];
    }
}
