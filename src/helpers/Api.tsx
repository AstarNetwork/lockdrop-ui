import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiContext, ApiProps } from './ApiContext';
import { getNetworkEndpoint, PlasmNetwork } from './plasmUtils';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;

function Api({ network = DEFAULT_NETWORK, children }: Props): React.ReactElement<Props> {
    const [isReady, setIsReady] = useState<boolean>(false);
    const value = useMemo<ApiProps>(() => ({ api, isReady, network }), [isReady]);

    useEffect(() => {
        const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});
        const url = getNetworkEndpoint(network);
        const provider = new WsProvider(url);
        api = new ApiPromise({
            provider,
            types,
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
