interface TransactionInput {
    prevout: Buffer;
    script: Buffer;
    sequence: Buffer;
    tree?: Buffer;
}

interface TransactionOutput {
    amount: Buffer;
    script: Buffer;
}

export default interface Transaction {
    version: Buffer;
    inputs: TransactionInput[];
    outputs?: TransactionOutput[];
    locktime?: Buffer;
    witness?: Buffer;
    timestamp?: Buffer;
    nVersionGroupId?: Buffer;
    nExpiryHeight?: Buffer;
    extraData?: Buffer;
}
