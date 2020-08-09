/* eslint-disable @typescript-eslint/no-namespace */
export declare namespace SoChainApi {
    export interface FromOutput {
        txid: string;
        output_no: number;
    }

    export interface Input {
        input_no: number;
        value: string;
        address: string;
        type: string;
        script: string;
        witness: string[];
        from_output: FromOutput;
    }

    export interface Output {
        output_no: number;
        value: string;
        address: string;
        type: string;
        script: string;
    }

    export interface Data {
        network: string;
        txid: string;
        blockhash: string;
        confirmations: number;
        time: number;
        inputs: Input[];
        outputs: Output[];
        tx_hex: string;
        size: number;
        version: number;
        locktime: number;
    }

    export interface Transaction {
        status: string;
        data: Data;
    }
}
