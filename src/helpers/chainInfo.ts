import { ApiPromise } from '@polkadot/api';
import { useMemo } from 'react';
import { useApi } from './Api';

export interface ChainInfo {
    tokenDecimals: number;
}

const DEFAULT_DECIMALS = 15;

function createInfo(api: ApiPromise): ChainInfo {
    const tokenDecimals = api.registry.chainDecimals || DEFAULT_DECIMALS;

    return {
        tokenDecimals,
    };
}

export default function useChainInfo(): ChainInfo {
    const { api, isReady } = useApi();

    return useMemo(() => createInfo(api), [api, isReady]);
}