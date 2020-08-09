export interface Block {
    hash: string;
    height: number;
    time: Date;
}

export interface Input {
    input_index: number;
    output_hash: string;
    output_index: number;
    value: number;
    address: string;
    script_signature: string;
    sequence: number;
    txinwitness: string[];
}

export interface Output {
    output_index: number;
    value: number;
    address: string;
    script_hex: string;
}

export interface Transaction {
    hash: string;
    received_at: Date;
    lock_time: number;
    block: Block;
    inputs: Input[];
    outputs: Output[];
    fees: number;
    amount: number;
    confirmations: number;
}
