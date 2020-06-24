/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is used for communicating with the Ethereum smart contract
import Lockdrop from '../../contracts/Lockdrop.json';
import SecondLockdrop from '../../contracts/Lockdrop.json';
import getWeb3 from '../getWeb3';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { LockEvent, LockSeason, LockInput } from '../../types/LockdropModels';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { isValidIntroducerAddress, defaultAddress, affiliationRate } from '../../data/affiliationProgram';
import { lockDurationToRate } from '../plasmUtils';
import { PlmDrop } from '../../types/PlasmDrop';
import Web3Utils from 'web3-utils';
import EthCrypto from 'eth-crypto';
import * as polkadotUtil from '@polkadot/util-crypto';
import { ecrecover, fromRpcSig, toBuffer, bufferToHex } from 'ethereumjs-util';
import { Toast } from 'react-toastify';

// todo: reduce client-side operations and replace it with data from the plasm node

/**
 * exchange rate at the start of April 14 UTC (at the end of the first lockdrop)
 * this is only used for the first lockdrop
 */
export const ethFinalExRate = 205.56;

// the total amount of issueing PLMs at 1st Lockdrop.
const totalAmountOfPLMs = new BigNumber('500000000.000000000000000');
const totalAmountOfPLMsForLockdrop = totalAmountOfPLMs.times(new BigNumber('17').div(new BigNumber('20')));

/**
 * generates a Plasm public address with the given ethereum public key
 * @param ethPubKey an uncompressed ethereum public key with the 0x prefix
 */
export function generatePlmAddress(ethPubKey: string) {
    // converts a given hex string into Uint8Array
    const toByteArray = (hexString: string) => {
        const result = [];
        for (let i = 0; i < hexString.length; i += 2) {
            result.push(parseInt(hexString.substr(i, 2), 16));
        }
        return new Uint8Array(result);
    };

    // compress 64byte key into 32+1 byte key
    const compressedPubKey = EthCrypto.publicKey.compress(ethPubKey);
    // hash to blake2
    const plasmPubKey = polkadotUtil.blake2AsU8a(toByteArray(compressedPubKey), 256);
    // encode address
    const plmAccountId = polkadotUtil.encodeAddress(plasmPubKey, 5);
    return plmAccountId;
}

/**
 * asks the user to sign a hashed message from their dApp browser to recover the user's public key
 * @param web3 a web3.js instance to access the user's wallet information
 * @param message an optional message that the user should sign
 */
export async function getPubKey(web3: Web3, message?: string) {
    let msg = 'Please Sign this message to generate Plasm Network address';
    // change message if the function provides one
    if (message) {
        msg = message;
    }
    const hash = web3.eth.accounts.hashMessage(msg);
    try {
        const addresses = await web3.eth.getAccounts();
        // the password parameter is only used for specific wallets (most wallets will prompt the user to provide it)
        const sig = '0x' + (await web3.eth.personal.sign(msg, addresses[0], 'SecureP4ssW0rd')).slice(2);
        const res = fromRpcSig(sig);

        return bufferToHex(ecrecover(toBuffer(hash), res.v, res.r, res.s));
    } catch (error) {
        console.log(error);
        return '0x0';
    }
}

/**
 * returns an array of locked events for the lock contract
 * this function searches from the genesis block
 * @param web3 a web3.js instance to interact with the blockchain
 * @param instance a contract instance to parse the contract events
 */
export async function getAllLockEvents(web3: Web3, instance: Contract): Promise<LockEvent[]> {
    // todo: set this value as the block number of where the contract was deployed for each network
    const mainnetStartBlock = 0;
    try {
        const ev = await instance.getPastEvents('Locked', {
            fromBlock: mainnetStartBlock,
        });

        const eventHashes = await Promise.all(
            ev.map(async e => {
                return Promise.all([Promise.resolve(e.returnValues), web3.eth.getTransaction(e.transactionHash)]);
            }),
        );

        return Promise.all(
            eventHashes.map(async e => {
                // e[0] is lock event and e[1] is block hash
                const blockHash = e[1];
                const lockEvent = e[0];

                const transactionString = await Promise.resolve(
                    web3.eth.getBlock((blockHash.blockNumber as number).toString()),
                );
                const time = transactionString.timestamp.toString();
                return {
                    eth: lockEvent.eth as BN,
                    duration: lockEvent.duration as number,
                    lock: lockEvent.lock as string,
                    introducer: lockEvent.introducer as string,
                    blockNo: blockHash.blockNumber,
                    timestamp: time,
                    lockOwner: blockHash.from,
                    blockHash: blockHash.blockHash,
                    transactionHash: blockHash.hash,
                } as LockEvent;
            }),
        );
    } catch (error) {
        console.log(error);
        // return an empty array when failed
        return [] as LockEvent[];
    }
}

/**
 * returns a 0 ethereum address if an empty string was provided.
 * this function is used for lockers with no introducers
 * @param aff a valid introducer ETH address
 */
export function defaultAffiliation(aff: string) {
    // check if affiliation address is not empty and is not themselves
    if (aff) {
        // return itself when it is a valid address
        return aff;
    } else {
        // if it is an invalid address, return the default affiliation address
        return defaultAddress;
    }
}

// export async function getEthUsdRate(endDate: string) {
//     // date format mm-DD-YYYY
//     const ethMarketApi = `https://api.coingecko.com/api/v3/coins/ethereum/history?date=${endDate}&localization=false`;
//     let usdRate = 0;
//     try {
//         const res = await fetch(ethMarketApi);
//         const data = await res.json();
//         usdRate = data.market_data.current_price.usd;
//     } catch (error) {
//         console.log(error);
//     }
//     return usdRate;
// }

function plmBaseIssueRatio(lockData: LockEvent, ethExchangeRate: BigNumber): BigNumber {
    // get lockTimeBonus * ethExRate
    const bonusRate = new BigNumber(lockDurationToRate(lockData.duration)).times(ethExchangeRate);

    // calculate issuingPLMRate = lockedEth([ETH]) * lockBonusRate * ethExRate
    const issuingRatio: BigNumber = new BigNumber(Web3Utils.fromWei(lockData.eth.toString(), 'ether')).times(
        new BigNumber(bonusRate),
    );
    return issuingRatio;
}

function totalPlmBaseIssuingRate(allLocks: LockEvent[], ethExchangeRate: BigNumber): BigNumber {
    return allLocks.reduce(
        (sum: BigNumber, value: LockEvent): BigNumber => sum.plus(plmBaseIssueRatio(value, ethExchangeRate)),
        new BigNumber(0),
    );
}

function plmBaseIssueAmountInLock(lock: LockEvent, totalPlmsRate: BigNumber, ethExchangeRate: BigNumber): BigNumber {
    const currentIssue = plmBaseIssueRatio(lock, ethExchangeRate);
    return totalAmountOfPLMsForLockdrop.times(currentIssue).div(totalPlmsRate);
}

/**
 * returns an array of addresses that referenced the given address for the affiliation program
 * @param address ETH address
 * @param lockData list of contract lock event
 */
function getAllAffReferences(address: string, lockData: LockEvent[]) {
    // check if there is
    const results: LockEvent[] = [];
    const refEvents = lockData.filter(e => e.introducer.toLowerCase() === address.toLowerCase());

    for (let i = 0; i < refEvents.length; i++) {
        results.push(refEvents[i]);
    }

    return results;
}

export function calculateNetworkAlpha(allLocks: LockEvent[]): BigNumber {
    const ethExchangeRate = new BigNumber(ethFinalExRate);

    const totalPlmRate = totalPlmBaseIssuingRate(allLocks, ethExchangeRate);

    // alpha_1 = totalAmountOfPLMsForLockdrop /totalPlmRate
    const alpha1 = totalAmountOfPLMsForLockdrop.div(totalPlmRate);

    return alpha1;
}

/**
 * calculate the total receiving PLMs from the lockdrop including the affiliation program bonus
 * in this function, affiliation means the current address being referenced by others
 * and introducer means this address referencing other affiliated addresses
 * @param address the lockdrop participant's ETH address
 * @param lockData a list of lockdrop contract events
 */
export function calculateTotalPlm(address: string, lockData: LockEvent[]): PlmDrop {
    const receivingPlm = new PlmDrop(address, new BigNumber(0), [], [], []);

    const currentAddressLocks = lockData.filter(i => i.lockOwner.toLowerCase() === address.toLowerCase());

    receivingPlm.locks = currentAddressLocks;

    const ethExchangeRate = new BigNumber(ethFinalExRate);

    // get total plm rate for calculating actual issuing PLMs.
    const totalPlmRate = totalPlmBaseIssuingRate(lockData, ethExchangeRate);

    for (let i = 0; i < currentAddressLocks.length; i++) {
        // calculate total base issuing PLM tokens
        const issuingPlm = plmBaseIssueAmountInLock(currentAddressLocks[i], totalPlmRate, ethExchangeRate);

        // add value to the total amount
        receivingPlm.basePlm = receivingPlm.basePlm.plus(issuingPlm);

        // self -> introducer : bonus getting PLMs.
        // check if this address has an introducer
        if (
            isValidIntroducerAddress(currentAddressLocks[i].introducer) &&
            currentAddressLocks[i].introducer !== defaultAddress
        ) {
            receivingPlm.introducerAndBonuses.push([
                currentAddressLocks[i].introducer,
                issuingPlm.times(new BigNumber(affiliationRate)),
            ]);
        }
    }

    // someone -> self(introducer) : bonus getting PLMs.
    // calculate affiliation bonus for this address
    if (isValidIntroducerAddress(address)) {
        const allRefs = getAllAffReferences(address, lockData);

        for (let i = 0; i < allRefs.length; i++) {
            // reference amount * 0.01
            receivingPlm.affiliationRefsBonuses.push([
                allRefs[i].lock,
                plmBaseIssueAmountInLock(allRefs[i], totalPlmRate, ethExchangeRate).times(
                    new BigNumber(affiliationRate),
                ),
            ]);
        }
    }
    return receivingPlm;
}

/**
 * parses through the given lock events to calculate the total amount of locked ETH
 * @param locks a list of lockdrop contract events
 */
export function getTotalLockVal(locks: LockEvent[]): string {
    let totalVal = new BigNumber(0);
    if (locks.length > 0) {
        for (let i = 0; i < locks.length; i++) {
            const currentEth = new BigNumber(locks[i].eth.toString());
            totalVal = totalVal.plus(currentEth);
        }
    }
    return Web3Utils.fromWei(totalVal.toFixed(), 'ether');
}

/**
 * authenticate if the client has web3 enabled wallet installed and can communicate with the blockchain
 * returns the web3.js instance, list of active accounts and the contract instance
 * @param lockSeason enum to indicate which lockdrop contract it should look for
 */
export async function connectWeb3(lockSeason: LockSeason) {
    try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
        //const web3 = getEthInst();

        if (web3 instanceof Web3) {
            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = (Lockdrop as any).networks[networkId];

            // create an empty contract instance first
            let instance = new web3.eth.Contract(
                Lockdrop.abi as any,
                deployedNetwork && deployedNetwork.address,
            ) as Contract;

            //todo: switch contract instance depending on lockdrop type
            //todo: assign different contract address depending on the lockdrop type
            switch (lockSeason) {
                case LockSeason.First:
                    instance = new web3.eth.Contract(
                        Lockdrop.abi as any,
                        deployedNetwork && deployedNetwork.address,
                    ) as Contract;
                    break;
                case LockSeason.Second:
                    instance = new web3.eth.Contract(
                        SecondLockdrop.abi as any,
                        deployedNetwork && deployedNetwork.address,
                    ) as Contract;
                    break;
            }

            return {
                web3: web3,
                accounts: accounts,
                contract: instance,
            };
        }
    } catch (error) {
        // Catch any errors for any of the above operations.
        alert('Failed to load web3, accounts, or contract. Check console for details.');
        console.error(error);
    }
    // return an empty value
    return {
        web3: {} as Web3,
        accounts: [''],
        contract: {} as Contract,
    };
}

/**
 * validate and create a transaction to the lock contract with the given parameter
 * @param txInput the lock parameter for the contract
 * @param address the address of the locker
 * @param contract smart contract instance used to invoke the contract method
 * @param messageToast message toast used to send feedback to the front end
 */
export async function submitLockTx(txInput: LockInput, address: string, contract: Contract, messageToast: Toast) {
    // checks user input
    if (txInput.amount > new BN(0) && txInput.duration) {
        //console.log(formInputVal);
        // return a default address if user input is empty
        const introducer = defaultAffiliation(txInput.affiliation).toLowerCase();
        try {
            // check user input
            if (introducer === address) {
                messageToast.error('You cannot affiliate yourself');
            } else if (introducer && !Web3.utils.isAddress(introducer)) {
                messageToast.error('Please input a valid Ethereum address');
            } else if (!isValidIntroducerAddress(introducer)) {
                messageToast.error('The given introducer is not registered in the affiliation program!');
            } else {
                // convert user input to Wei
                const amountToSend = Web3.utils.toWei(txInput.amount, 'ether');

                // communicate with the smart contract
                await contract.methods.lock(txInput.duration, introducer).send({
                    from: address,
                    value: amountToSend,
                });

                messageToast.success(`Successfully locked ${txInput.amount} ETH for ${txInput.duration} days!`);
                return true;
            }
        } catch (error) {
            messageToast.error('error!\n' + error.message);
        }
    } else {
        messageToast.error('You are missing an input!');
    }
    return false;
}
