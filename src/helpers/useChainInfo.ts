import { ApiPromise } from '@polkadot/api';
import { useMemo } from 'react';
import { useApi } from '../api/Api';
import BN from 'bn.js';
import { formatBalance } from '@polkadot/util';

export interface ChainInfo {
    tokenDecimals: number;
    formatBalance: (input?: string | number | BN | BigInt | undefined) => string;
}

const DEFAULT_DECIMALS = 15;

function createInfo(api: ApiPromise): ChainInfo {
    const tokenDecimals = api.registry.chainDecimals[0] || DEFAULT_DECIMALS;

    return {
        tokenDecimals,
        formatBalance: (input?: string | number | BN | BigInt | undefined) => {
            return formatBalance(
                input,
                {
                    withSi: true,
                    withUnit: 'PLM',
                },
                tokenDecimals,
            );
        },
    };
}

export default function useChainInfo(): ChainInfo {
    const { api, isReady } = useApi();

    // eslint-disable-next-line
    return useMemo(() => createInfo(api), [api, isReady]);
}
