/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';

async function web3Listener() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const web3 = new Web3((window as any).ethereum);
        try {
            // Request account access if needed
            //await (window as any).ethereum.enable();
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Dapp browser detected');

            // Accounts now exposed
            return web3;
        } catch (error) {
            return error;
        }
    }
    // Legacy dapp browsers...
    else if ((window as any).web3) {
        // Use Mist/MetaMask's provider.
        const web3 = (window as any).web3;
        console.log('Injected web3 detected.');
        return web3;
    }
    // Fallback to localhost; use dev console port by default...
    else {
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        const web3 = new Web3(provider);
        console.log('No web3 instance injected, using Local web3.');
        return web3;
    }
}

export const removeWeb3Event = (): void => {
    new Promise((resolve, reject) => {
        try {
            window.removeEventListener('load', () => resolve(web3Listener()));
        } catch (error) {
            reject(error);
        }
    });
};

const getWeb3 = (): Promise<unknown> =>
    new Promise((resolve, reject) => {
        // check if the event was already fired
        if (document.readyState === 'complete') {
            // reload page to reset the event
            window.location.reload();
        }

        // Wait for loading completion to avoid race conditions with web3 injection timing.
        try {
            window.addEventListener('load', () => resolve(web3Listener()));
        } catch (error) {
            reject(error);
        }
    });

export default getWeb3;
