import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonPage,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonButton,
    IonCol,
    IonGrid,
    IonRow,
    IonButtons,
    IonIcon,
    IonChip,
    IonItem,
    IonLabel,
} from '@ionic/react';
import React, { useState } from 'react';
import './LandingPage.css';
import CountdownTimer from '../components/CountdownTimer';
import { DropdownOption, OptionItem } from '../components/DropdownOption';

const endDate = '2020-02-29';

const tokenTypes: OptionItem[] = [
    { label: 'ETH', value: 'eth' },
    //{ label: 'BTC', value: 'btc' },
    //{ label: 'DOT', value: 'dot' },
    //{ label: 'EOS', value: 'eos' }
];

const LandingPage: React.FC = () => {
    const [tokenType, setTokenType] = useState('');
    const [canLock, setLockState] = useState(true);
    const [redirect, setRedirect] = useState('');

    function handleTokenChoose(dropdownItem: string) {
        try {
            // check if the client meets the requirements for transaction
            switch (dropdownItem) {
                case 'eth':
                    setTokenType(dropdownItem);

                    setRedirect('/eth-lockdrop');
                    setLockState(false);
                    break;
                //todo: add auth check for other tokens
                case 'btc':
                    break;
                case 'dot':
                    break;
                case 'eos':
                    break;
            }
        } catch (err) {
            alert('found error ' + err);
        }
    }

    function handleOnClick() {
        console.log('you choose ' + tokenType);
    }
    return (
        <IonPage>
            <IonHeader translucent>
                <IonToolbar>
                    <IonTitle>Plasm Network</IonTitle>
                    <IonButtons slot="end">
                        <IonButton slot="primary" href="https://github.com/staketechnologies/Plasm.git">
                            <IonIcon slot="icon-only" name="logo-github" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol></IonCol>
                        <IonCol size="auto">
                            <div className="main-content">
                                <IonCard>
                                    <img src="/assets/plasm-logo.png" alt=""></img>
                                    <IonCardHeader>
                                        <IonCardTitle>Plasm Network Lockdrop</IonCardTitle>
                                        <IonCardSubtitle>Lockdrop form for PLM</IonCardSubtitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        The Plasm Network is a scaling DApps platform on Substrate. This means that the
                                        Plasm Network will be connected to Polkadot in the future. Our platform is
                                        scalable because we are implementing layer2 solutions such as Plasma and
                                        Lightning Network. It aims at improving smart contract performance and the main
                                        platform for developing layer2 applications. For details regarding the specs for
                                        the Plasm Network, please refer to our{' '}
                                        <a href="https://github.com/staketechnologies/plasmdocs/blob/master/wp/en.pdf">
                                            white paper
                                        </a>
                                        .
                                        <br />
                                        <IonChip>
                                            <CountdownTimer deadline={endDate}></CountdownTimer>
                                        </IonChip>
                                        until closing.
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        </IonCol>
                        <IonCol></IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol></IonCol>

                        <IonCol>
                            <IonButton
                                size="large"
                                expand="block"
                                disabled={canLock}
                                onClick={handleOnClick}
                                href={redirect}
                            >
                                Start Lockdrop
                            </IonButton>
                        </IonCol>
                        <IonCol size="auto">
                            <IonItem>
                                <IonLabel>Tokens Locking in</IonLabel>
                                <DropdownOption
                                    dataSets={tokenTypes}
                                    onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        //setTokenType(e.target.value)
                                        handleTokenChoose(e.target.value)
                                    }
                                ></DropdownOption>
                            </IonItem>
                        </IonCol>

                        <IonCol></IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default LandingPage;
