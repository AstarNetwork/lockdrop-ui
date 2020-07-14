/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../helpers/plasmUtils';
import { Claim, Lockdrop } from 'src/types/LockdropModels';

interface Props {
    claimParams?: Lockdrop[];
    plasmApi: ApiPromise;
}

const ClaimStatus: React.FC<Props> = ({ claimParams, plasmApi }) => {
    //const [claimInfo, setClaimInfo] = useState<Claim[]>();

    useEffect(() => {
        try {
            if (claimParams) {
                const claimData: Claim[] = [];

                claimParams.map(async i => {
                    const lockStruct = plasmUtils.createLockParam(
                        i.type,
                        i.transactionHash.toHex(),
                        i.publicKey.toHex(),
                        i.duration.toString(),
                        i.value.toString(),
                    );
                    const claimReq = await plasmUtils.getClaimStatus(plasmApi, lockStruct.hash);
                    if (typeof claimReq !== 'undefined') {
                        claimData.push(claimReq);
                    }
                });

                console.log(claimData);
                //setClaimInfo(claimData);
            }
        } catch (e) {
            console.log(e.message.toString());
        }
    }, [claimParams, plasmApi]);

    return (
        <div>
            <h3>Real-time lockdrop claim status</h3>
            {claimParams ? (
                claimParams.map(e => <ClaimItem key={e.transactionHash.toHex()} lockParam={e} plasmApi={plasmApi} />)
            ) : (
                <>
                    <p>No lock claims found</p>
                </>
            )}
        </div>
    );
};

export default ClaimStatus;

interface ItemProps {
    lockParam: Lockdrop;
    plasmApi: ApiPromise;
}
const ClaimItem: React.FC<ItemProps> = ({ lockParam, plasmApi }) => {
    const [claimData, setClaimData] = useState<Claim>();

    const claimId = plasmUtils.createLockParam(
        lockParam.type,
        lockParam.transactionHash.toHex(),
        lockParam.publicKey.toHex(),
        lockParam.duration.toString(),
        lockParam.value.toString(),
    ).hash;

    const submitClaimReq = (param: Lockdrop) => {
        const _lock = plasmUtils.createLockParam(
            param.type,
            param.transactionHash.toHex(),
            param.publicKey.toHex(),
            param.duration.toString(),
            param.value.toString(),
        );
        const _nonce = plasmUtils.claimPowNonce(_lock.hash);
        // send lockdrop claim request
        plasmUtils // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sendLockClaim(plasmApi, _lock as any, _nonce)
            .then(res => {
                console.log('Claim ID: ' + _lock.hash);
                console.log('Request transaction hash:\n' + res.toHex());
            });
    };

    useEffect(() => {
        plasmUtils.getClaimStatus(plasmApi, claimId).then(i => {
            setClaimData(i);
        });
    }, [claimId]);

    return (
        <div>
            <p>Receiving amount: {lockParam.value.toString()}</p>
            {claimData && <p>Claim found for {claimData.params.transactionHash.toHex()}</p>}
            <button onClick={() => submitClaimReq(lockParam)}>Send Request</button>
        </div>
    );
};
