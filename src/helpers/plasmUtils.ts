/* eslint-disable @typescript-eslint/camelcase */
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Lockdrop } from '../types/LockdropModels';
import { Hash } from '@polkadot/types/interfaces';
import * as polkadotUtil from '@polkadot/util-crypto';
import { u8aConcat } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';

/**
 * bitmask used for real-time lockdrop claim request Pow security
 */
export enum PlasmNetwork {
    Local,
    Dusty,
    Main,
}

/**
 * converts the plasm network minimum denominator to PLM
 * @param femto minimum token value
 */
export function femtoToPlm(femto: BigNumber) {
    const plmDenominator = new BigNumber(10).pow(-15);
    return femto.times(plmDenominator);
}

/**
 * used for adding new polkadot-js api types for communicating with plasm node
 */
export const plasmTypeReg = new TypeRegistry();

/**
 * establishes a connection between the client and the plasm node with the given endpoint.
 * this will default to the main net node
 * @param network end point for the client to connect to
 */
export async function createDustyPlasmInstance(network?: PlasmNetwork) {
    let endpoint = '';

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

    const wsProvider = new WsProvider(endpoint);

    return await ApiPromise.create({
        provider: wsProvider,
        types: {
            ClaimId: 'H256',
            Lockdrop: {
                type: 'u8',
                transaction_hash: 'H256',
                public_key: '[u8; 33]',
                duration: 'u64',
                value: 'u128',
            },
            TickerRate: {
                authority: 'u16',
                btc: 'DollarRate',
                eth: 'DollarRate',
            },
            DollarRate: 'u128',
            AuthorityId: 'AccountId',
            AuthorityVote: 'u32',
            ClaimVote: {
                claim_id: 'ClaimId',
                approve: 'bool',
                authority: 'u16',
            },
            Claim: {
                params: 'Lockdrop',
                approve: 'AuthorityVote',
                decline: 'AuthorityVote',
                amount: 'u128',
                complete: 'bool',
            },
        },
    });
}

/**
 * convert the given lock duration in to PLM issue bonus rate
 * @param duration token lock duration
 */
export function lockDurationToRate(duration: number) {
    if (duration < 30) {
        return 0;
    } else if (duration < 100) {
        return 24;
    } else if (duration < 300) {
        return 100;
    } else if (duration < 1000) {
        return 360;
    } else {
        return 1600;
    }
}

/**
 * submits a real-time lockdrop claim request to plasm node and returns the transaction hash.
 * this is a unsigned transaction that is only authenticated by a simple PoW to prevent spamming
 * @param api plasm node api instance (polkadot-js api)
 * @param lockParam lockdrop parameter that contains the lock data
 * @param nonce nonce for PoW authentication with the node
 */
export async function sendLockClaim(api: ApiPromise, lockParam: Lockdrop, nonce: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimRequestTx = await (api.tx as any).plasmLockdrop.request(lockParam, nonce);

    const txHash = await claimRequestTx.sign();

    return txHash as Hash;
}

/**
 * a Proof-of-Work function that hashes the lockdrop claim ID and the nonce
 * together to verify the unsigned transaction.
 * this will return the correct nonce in hex string
 * @param claimId the real-time lockdrop claim ID (blake2 hashed lock parameter)
 */
export function claimPowNonce(claimId: Uint8Array): Uint8Array {
    //console.log('ClaimId: ' + u8aToHex(claimId));
    let nonce = polkadotUtil.randomAsU8a();
    while (true) {
        const hash = polkadotUtil.blake2AsU8a(u8aConcat(claimId, nonce));
        //console.log('PoW hash: ' + u8aToHex(hash));
        if (hash[0] > 0) {
            nonce = polkadotUtil.randomAsU8a();
            //console.log('Next nonce: ' + u8aToHex(nonce));
        } else {
            return nonce;
        }
    }
}
