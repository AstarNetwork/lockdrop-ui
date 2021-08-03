import React from 'react';
import { ApiPromise } from '@polkadot/api';
import { PlasmNetwork } from '../helpers/plasmUtils';

export interface ApiProps {
    api: ApiPromise;
    isReady: boolean;
    network: PlasmNetwork;
}

export const ApiContext = React.createContext<ApiProps>({} as ApiProps);
