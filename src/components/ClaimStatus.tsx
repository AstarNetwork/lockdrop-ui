/* eslint-disable react/prop-types */
import React from 'react';

interface Props {
    claimIDs: string[];
}

const ClaimStatus: React.FC<Props> = ({ claimIDs }) => {
    return (
        <div>
            <p>Hello World</p>
            {claimIDs.map((e, i) => (
                <p key={i}>{e}</p>
            ))}
        </div>
    );
};

export default ClaimStatus;
