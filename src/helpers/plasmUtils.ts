/* eslint-disable @typescript-eslint/camelcase */
import BigNumber from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Hash, H256 } from '@polkadot/types/interfaces';
import * as polkadotUtil from '@polkadot/util-crypto';
import { u8aConcat } from '@polkadot/util';
import { Struct, TypeRegistry, u64, u128, U8aFixed, u8 } from '@polkadot/types';
import * as plasmDefinitions from '@plasm/types/interfaces/definitions';

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
export async function createPlasmInstance(network?: PlasmNetwork) {
    let endpoint = '';
    const types = Object.values(plasmDefinitions).reduce((res, { types }): object => ({ ...res, ...types }), {});

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
            ...types,
            // aliases that don't do well as part of interfaces
            'voting::VoteType': 'VoteType',
            'voting::TallyType': 'TallyType',
            // chain-specific overrides
            Address: 'GenericAddress',
            Keys: 'SessionKeys4',
            StakingLedger: 'StakingLedgerTo223',
            Votes: 'VotesTo230',
            ReferendumInfo: 'ReferendumInfoTo239',
        },
        // override duplicate type name
        typesAlias: { voting: { Tally: 'VotingTally' } },
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
 * Create a lock parameter object with the given lock information.
 * This is used for the real-time lockdrop module in Plasm for both ETH and BTC locks
 * @param network the lockdrop network (0: bitcoin, 1: ethereum)
 * @param transactionHash the lock transaction hash in hex string
 * @param publicKey locker's public key in hex string
 * @param duration lock duration in Unix epoch (seconds)
 * @param value lock value in the minimum denominator (Wei or Satoshi)
 */
export function createLockParam(
    network: string,
    transactionHash: string,
    publicKey: string,
    duration: string,
    value: string,
) {
    const lockParam = new Struct(
        plasmTypeReg,
        {
            type: u8,
            transactionHash: 'H256',
            publicKey: U8aFixed, // [u8; 33]
            duration: u64,
            value: u128,
        },
        {
            type: network,
            transactionHash: transactionHash,
            publicKey: new U8aFixed(plasmTypeReg, publicKey, 264),
            duration: new u64(plasmTypeReg, duration),
            value: new u128(plasmTypeReg, value),
        },
    );

    return lockParam;
}

/**
 * Returns the claim ID that is used to look up lockdrop claim requests
 * @param lockdropParam Lockdrop claim request parameter
 */
export function getClaimId(lockdropParam: Struct) {
    return lockdropParam.hash;
}

/**
 * submits a real-time lockdrop claim request to plasm node and returns the transaction hash.
 * this is a unsigned transaction that is only authenticated by a simple PoW to prevent spamming
 * @param api plasm node api instance (polkadot-js api)
 * @param lockParam lockdrop parameter that contains the lock data
 * @param nonce nonce for PoW authentication with the node
 */
export async function sendLockClaim(api: ApiPromise, lockParam: Struct, nonce: Uint8Array): Promise<Hash> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimRequestTx = api.tx.plasmLockdrop.request(lockParam.toU8a(), nonce);

    const txHash = await claimRequestTx.send();

    return txHash;
}

/**
 * a Proof-of-Work function that hashes the lockdrop claim ID and the nonce
 * together to verify the unsigned transaction.
 * this will return the correct nonce in hex string
 * @param claimId the real-time lockdrop claim ID (blake2 hashed lock parameter)
 */
export function claimPowNonce(claimId: Uint8Array | H256): Uint8Array {
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
