import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import Web3 from 'web3';
import { ApiContext, ApiProps } from './ApiContext';
import { getNetworkEndpoint, PlasmNetwork } from './plasmUtils';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;
let web3: Web3;

function Api({ network = DEFAULT_NETWORK, children }: Props): React.ReactElement<Props> {
    const [isReady, setIsReady] = useState<boolean>(false);
    const value = useMemo<ApiProps>(() => ({ api, web3, isReady, network }), [isReady, network]);

    // useEffect(() => {
    //     const connect = async () => {
    //         web3 = await web3Listener();
    //     };
    //     connect();
    //     console.log('initializing web3', web3);
    // }, []);

    useEffect(() => {
        const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});
        const url = getNetworkEndpoint(network);
        const provider = new WsProvider(url);
        api = new ApiPromise({
            provider,
            types: {
                ...types,
                // aliases that don't do well as part of interfaces
                'voting::VoteType': 'VoteType',
                'voting::TallyType': 'TallyType',
                // chain-specific overrides
                Address: 'GenericAddress',
                Keys: 'SessionKeys4',
                StakingLedger: 'StakingLedgerTo223',
                Votes: 'VotesTo230',
                ReferendumInfo: 'ReferendumInfoTo239',
            },
        });
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
