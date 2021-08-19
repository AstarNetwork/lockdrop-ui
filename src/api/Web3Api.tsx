import React, { useMemo, useState, useEffect, useContext } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Web3Context, Web3ApiProps } from '../contexts/Web3Context';
import * as ethLockdrop from '../helpers/lockdrop/EthereumLockdrop';
import { removeWeb3Event } from '../helpers/getWeb3';
import { LockSeason } from '../types/LockdropModels';
import { firstLockContract, secondLockContract } from '../data/lockInfo';

let web3: Web3;

export const isMainnet = (currentNetwork: string): boolean => {
    return currentNetwork === 'main';
};

export const plasmNetToEthNet = 'Main Network';

function Web3Api({ contractAddress, children }: Props): React.ReactElement<Props> {
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
    const [_contractAddress, _setContactAddress] = useState<string | undefined>(contractAddress);

    const createContract = async (address: string | undefined, isInitial: boolean) => {
        console.log('Creating contract with address ', address);
        _setContactAddress(address);
        try {
            if (web3 && address) {
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
            setError(err.message);
        }
    };

    const changeLockSeason = async (season: LockSeason, isMainLock: boolean) => {
        const contracts = season === LockSeason.First ? firstLockContract : secondLockContract;
        const chainType = isMainLock ? 'main' : 'private';
        const contAddr = contracts.find(i => i.type === chainType)?.address;

        if (typeof contAddr !== 'undefined') {
            _setContactAddress(contAddr);
        } else {
            setError('Could not find lockdrop contract');
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
            setParameters: (isMainnetLock, lockSeason) => {
                setIsMainnetLock(isMainnetLock);
                changeLockSeason(lockSeason, isMainnetLock);
            },
        }),
        [
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

            console.log('Initializing web3, isMainnetLock ', isMainnetLock);
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
        // eslint-disable-next-line
    }, [isMainnetLock]);

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

interface Props {
    contractAddress?: string;
    children: React.ReactNode;
}

export default React.memo(Web3Api);
export const useEth = (): Web3ApiProps => ({ ...useContext(Web3Context) });
