import React, { useMemo, useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Web3Context, Web3ApiProps } from './Web3Context';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import { removeWeb3Event } from './getWeb3';
import { defaultContract } from 'src/data/lockInfo';

let web3: Web3;

export const isMainnet = (currentNetwork: string) => {
    return currentNetwork === 'main';
};

function Web3Api({ contractAddress = defaultContract, children }: Props): React.ReactElement<Props> {
    // TODO useReducer, to many state variables
    const [currentNetwork, setCurrentNetwork] = useState<string>('');
    const [latestBlock, setLatestBlock] = useState<number>(0);
    const [account, setAccount] = useState<string>('');
    const [contract, setContract] = useState<Contract>();
    const [lockdropStart, setLockdropStart] = useState<string>('0');
    const [lockdropEnd, setLockdropEnd] = useState<string>('0');
    const [error, setError] = useState<string>();
    const [isChangingContract, setIsChangingContract] = useState<boolean>(false);
    const [isWeb3Loading, setIsWeb3Loading] = useState<boolean>(false);
    const [isMainnetLock, setIsMainnetLock] = useState<boolean | undefined>(undefined);
    const [_contractAddress, _setContactAddress] = useState<string>(contractAddress);

    const plasmNetToEthNet = isMainnetLock ? 'Main Network' : 'Ropsten';

    const createContract = async (address: string, isInitial: boolean) => {
        console.log('Creating contract with address ', address);
        _setContactAddress(address);
        try {
            if (web3) {
                if (!isInitial) {
                    setIsChangingContract(true);
                }

                setError(undefined);
                const contract = await ethLockdrop.createContractInstance(web3, address);

                const start = await ethLockdrop.getContractStartDate(contract);
                const end = await ethLockdrop.getContractEndDate(contract);
                setLockdropStart(start);
                setLockdropEnd(end);
                setContract(contract);

                if (!isInitial) {
                    setIsChangingContract(false);
                }
            }
        } catch (err) {
            setError(err);
        }
    };

    const value = useMemo<Web3ApiProps>(
        () => ({
            web3,
            isWeb3Loading,
            currentNetwork,
            latestBlock,
            account,
            contract,
            lockdropStart,
            lockdropEnd,
            error,
            isChangingContract,
            changeContractAddress: address => createContract(address, false),
            setLatestBlock: block => setLatestBlock(block),
            setAccount: account => setAccount(account),
            setIsMainnetLock: value => setIsMainnetLock(value),
        }),
        [
            web3,
            isWeb3Loading,
            currentNetwork,
            latestBlock,
            account,
            contract,
            lockdropStart,
            lockdropEnd,
            error,
            isChangingContract,
        ],
    );

    useEffect(() => {
        const initialize = async () => {
            if (typeof isMainnetLock === 'undefined') {
                console.log('isMainnetLock is undefined');
                return;
            }

            console.log('initializing web3, isMainnetLock ', isMainnetLock);
            setError(undefined);
            setIsWeb3Loading(true);

            try {
                web3 = await ethLockdrop.connectWeb3();

                const network = await web3.eth.net.getNetworkType();
                setCurrentNetwork(network);

                if (isMainnet(network) === isMainnetLock) {
                    const accounts = await ethLockdrop.fetchAllAddresses(web3);
                    setAccount(accounts[0]);

                    const latest = await web3.eth.getBlockNumber();
                    setLatestBlock(latest);

                    createContract(_contractAddress, true);
                } else {
                    setError('User is not connected to ' + plasmNetToEthNet);
                }
            } catch (err) {
                console.log(err);
                setError(err.message);
            } finally {
                setIsWeb3Loading(false);
            }
        };

        initialize();

        return () => {
            removeWeb3Event();
        };
    }, [isMainnetLock]);

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

interface Props {
    contractAddress?: string;
    children: React.ReactNode;
}

export default React.memo(Web3Api);
export const useEth = () => ({ ...useContext(Web3Context) });
