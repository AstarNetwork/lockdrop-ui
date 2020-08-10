/* eslint-disable react/prop-types */
import React from 'react';
import { IonModal, IonContent, IonButton } from '@ionic/react';

interface Props {
    showModal: boolean;
    onAgree?: Function;
    onDecline?: Function;
}

const TosAgreementModal: React.FC<Props> = ({ showModal, onAgree, onDecline }) => {
    return (
        <>
            <IonModal isOpen={showModal} onDidDismiss={() => onDecline && onDecline()}>
                <IonContent>
                    <p>Hey</p>
                    <IonButton onClick={() => onAgree && onAgree()}>Press</IonButton>
                </IonContent>
            </IonModal>
        </>
    );
};

export default TosAgreementModal;
