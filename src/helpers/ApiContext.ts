import React from 'react';
import { ApiPromise } from '@polkadot/api';

export interface ApiProps {
    api: ApiPromise;
    isReady: boolean;
}

export const ApiContext = React.createContext<ApiProps>({} as ApiProps);
