import Web3 from 'web3';

// const getWeb3 = () =>
//     new Promise((resolve, reject) => {
//         // Wait for loading completion to avoid race conditions with web3 injection timing.
//         window.addEventListener('load', async () => {
//             // Modern dapp browsers...
//             if ((window as any).ethereum) {
//                 const web3 = new Web3((window as any).ethereum);
//                 try {
//                     // Request account access if needed
//                     await (window as any).ethereum.enable();
//                     // Acccounts now exposed
//                     resolve(web3);
//                 } catch (error) {
//                     reject(error);
//                 }
//             }
//             // Legacy dapp browsers...
//             else if ((window as any).web3) {
//                 // Use Mist/MetaMask's provider.
//                 const web3 = (window as any).web3;
//                 console.log('Injected web3 detected.');
//                 resolve(web3);
//             }
//             // Fallback to localhost; use dev console port by default...
//             else {
//                 const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
//                 const web3 = new Web3(provider);
//                 console.log('No web3 instance injected, using Local web3.');
//                 resolve(web3);
//             }
//         });
//     });

// export default getWeb3;

let p: Promise<Web3>;

const getWeb3 = (): Promise<Web3> => {
    if (!p) {
        p = new Promise<Web3>(resolve => {
            // Wait for loading completion to avoid race conditions with web3 injection timing.
            window.addEventListener('load', () => {
                let web3: Web3 = (window as any).web3 as Web3;

                // Checking if Web3 has been injected by the browser (Mist/MetaMask)
                if (typeof web3 !== 'undefined') {
                    console.log('Using injected web3 provider');
                    web3 = new Web3(web3.currentProvider);
                } else {
                    // Fallback to localhost if no web3 injection.
                    console.log('No web3 instance injected, using Local web3.');
                    const provider = new Web3.providers.HttpProvider('http://localhost:8545');
                    web3 = new Web3(provider);
                }
                (window as any).web3 = web3;
                resolve(web3);
            });
        });
    }
    return p;
};

export default getWeb3;
