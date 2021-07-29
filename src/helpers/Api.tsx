import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise } from '@polkadot/api';
import { ApiContext, ApiProps } from './ApiContext';
import { getApi, PlasmNetwork } from './plasmUtils';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;

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
