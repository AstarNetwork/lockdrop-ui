/* eslint-disable react/prop-types */
import React from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonLabel } from '@ionic/react';
import { qrEncodeUri } from '../../helpers/lockdrop/BitcoinLockdrop';

interface Props {
    address: string;
}
const QrEncodedAddress: React.FC<Props> = ({ address }) => {
    return (
        <>
            <IonCard>
                <IonCardHeader>
                    <img src={qrEncodeUri(address)} />
                    <IonCardSubtitle>Please send the funds you like to lock to this P2SH address</IonCardSubtitle>
                    <IonCardTitle>Sign Message</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <IonLabel>{address}</IonLabel>
                </IonCardContent>
            </IonCard>
        </>
    );
};

export default QrEncodedAddress;
