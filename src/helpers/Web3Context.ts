import React from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

export interface Web3ApiProps {
    web3: Web3;
    isWeb3Loading: boolean;
    currentNetwork: string;
    latestBlock: number;
    account: string;
    contract: Contract | undefined;
    lockdropStart: string;
    lockdropEnd: string;
    error: string | undefined;
    isChangingContract: boolean;
    changeContractAddress: (address: string) => void;
    setLatestBlock: (block: number) => void;
    setAccount: (account: string) => void;
    setIsMainnetLock: (value: boolean) => void;
}

export const Web3Context = React.createContext<Web3ApiProps>({} as Web3ApiProps);
