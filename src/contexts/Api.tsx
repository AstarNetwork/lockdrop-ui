import React, { useMemo, useState, useEffect, useContext } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ApiContext, ApiProps } from './ApiContext';
import { PlasmNetwork } from '../helpers/plasmUtils';
import { plasmDefinitions, dustyDefinitions } from '@plasm/types';

const DEFAULT_NETWORK = PlasmNetwork.Local;
let api: ApiPromise;

/**
 * gets endpoint url for a given network
 * @param network the network
 */
export function getNetworkEndpoint(network?: PlasmNetwork) {
    let endpoint: string;

    switch (network) {
        case PlasmNetwork.Local:
            endpoint = 'ws://127.0.0.1:9944';
            break;
        case PlasmNetwork.Dusty:
            endpoint = 'wss://rpc.dusty.plasmnet.io/';
            break;
        case PlasmNetwork.Main: // main net endpoint will be the default value
        default:
            endpoint = 'wss://rpc.plasmnet.io';
            break;
    }

    return endpoint;
}

/**
 * creates ApiPromise for a given network
 * @param network end point for the client to connect to
 */
export function getApi(network: PlasmNetwork): ApiPromise {
    const types = network === PlasmNetwork.Main ? plasmDefinitions : dustyDefinitions;
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
