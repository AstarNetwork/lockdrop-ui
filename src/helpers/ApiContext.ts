import React from 'react';
import { ApiPromise } from '@polkadot/api';
import Web3 from 'web3';
import { PlasmNetwork } from './plasmUtils';

export interface ApiProps {
    api: ApiPromise;
    web3: Web3;
    isReady: boolean;
    network: PlasmNetwork;
}

export const ApiContext = React.createContext<ApiProps>({} as ApiProps);
