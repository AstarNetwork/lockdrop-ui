import { PlasmNetwork } from '../helpers/plasmUtils';

const DEFAULT_ENDPOINT_INDEX = 1;

interface Endpoint {
    network: PlasmNetwork;
    address: string;
}

const endpoints: Endpoint[] = [
    {
        network: PlasmNetwork.Local,
        address: 'ws://127.0.0.1:9944',
    },
    {
        network: PlasmNetwork.Main,
        address: 'wss://rpc.plasmnet.io',
    },
];

/**
 * gets endpoint url for a given network
 * @param network the network
 */
export function getNetworkEndpoint(network?: PlasmNetwork): string {
    const endpoint = endpoints.find(x => x.network === network) || endpoints[DEFAULT_ENDPOINT_INDEX];
    return endpoint.address;
}
