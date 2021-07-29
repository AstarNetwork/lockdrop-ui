import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise } from '@polkadot/api';
import Web3 from 'web3';
import { ApiContext, ApiProps } from './ApiContext';
import { getApi, PlasmNetwork } from './plasmUtils';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;
let web3: Web3;

function Api({ network = DEFAULT_NETWORK, children }: Props): React.ReactElement<Props> {
    const [isReady, setIsReady] = useState<boolean>(false);
    const value = useMemo<ApiProps>(() => ({ api, web3, isReady, network }), [isReady, network]);

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
