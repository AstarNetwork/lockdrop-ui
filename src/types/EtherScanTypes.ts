// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace EtherScanApi {
    export interface Result {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        timeStamp: string;
        gasPrice: string;
        gasUsed: string;
        logIndex: string;
        transactionHash: string;
        transactionIndex: string;
    }

    export interface Response {
        status: string;
        message: string;
        result: Result[];
    }
}
