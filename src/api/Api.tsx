import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiContext, ApiProps } from '../contexts/ApiContext';
import { PlasmNetwork } from '../helpers/plasmUtils';
import { getNetworkEndpoint } from '../config/endpoints';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;

// Ignore camel case complaints.
/* eslint-disable */
const types = {
    AccountInfo: 'AccountInfoWithRefCount',
    AuthorityId: 'AccountId',
    AuthorityVote: 'u32',
    Claim: {
        amount: 'u128',
        approve: 'BTreeSet<AuthorityId>',
        complete: 'bool',
        decline: 'BTreeSet<AuthorityId>',
        params: 'Lockdrop',
    },
    ClaimId: 'H256',
    ClaimVote: {
        approve: 'bool',
        authority: 'u16',
        claim_id: 'ClaimId',
    },
    DollarRate: 'u128',
    Keys: 'SessionKeys2',
    Lockdrop: {
        duration: 'u64',
        public_key: '[u8; 33]',
        transaction_hash: 'H256',
        type: 'u8',
        value: 'u128',
    },
    PredicateHash: 'H256',
    RefCount: 'u8',
    TickerRate: {
        authority: 'u16',
        btc: 'u128',
        eth: 'u128',
    },
};
/* eslint-enable *?

/**
 * creates ApiPromise for a given network
 * @param network end point for the client to connect to
 */
export function getApi(network: PlasmNetwork): ApiPromise {
    const url = getNetworkEndpoint(network);
    const provider = new WsProvider(url);
    return new ApiPromise({
        provider,
        types: {
            ...types,
            LookupSource: 'MultiAddress',
        },
    });
}

/**
 * establishes a connection between the client and the plasm node with the given endpoint.
 * this will default to the main net node
 * @param network end point for the client to connect to
 */
export async function createPlasmInstance(network?: PlasmNetwork) {
    const api = getApi(network || PlasmNetwork.Main);
    return await api.isReady;
}

function Api({ network = DEFAULT_NETWORK, children }: Props): React.ReactElement<Props> {
    const [isReady, setIsReady] = useState<boolean>(false);
    const value = useMemo<ApiProps>(() => ({ api, isReady, network }), [isReady, network]);

    useEffect(() => {
        api = getApi(network);
        api.on('connected', (): void => {
            api.isReady.then((): void => {
                setIsReady(true);
            });
        });

        return () => {
            api && api.isConnected && api.disconnect();
        };
        // eslint-disable-next-line
    }, [network]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

interface Props {
    network?: PlasmNetwork;
    children: React.ReactNode;
}

export default React.memo(Api);
export const useApi = () => ({ ...useContext(ApiContext) });
