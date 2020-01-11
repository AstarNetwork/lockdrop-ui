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
    IonChip
} from '@ionic/react';
import React from 'react';
import './LandingPage.css';
import { logoGithub } from 'ionicons/icons';
import CountdownTimer from '../components/CountdownTimer';

const endDate = '2020-02-24';

const LandingPage: React.FC = () => {

    return (
        <IonPage>
            <IonHeader translucent>
                <IonToolbar>
                    <IonTitle>Plasm Network</IonTitle>
                    <IonButtons slot='end'>
                        <IonButton slot='primary' href='https://github.com/staketechnologies/Plasm.git'>
                            <IonIcon slot='icon-only' icon={logoGithub} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>

                        </IonCol>
                        <IonCol size='auto'>
                            <div className='main-content'>
                                <IonCard>
                                    <img src='/assets/plasm-logo.png' alt=''></img>
                                    <IonCardHeader>
                                        <IonCardTitle>Plasm Network Lockdrop</IonCardTitle>
                                        <IonCardSubtitle>Lockdrop form for PLM</IonCardSubtitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        The Plasm Network is a scaling DApps platform on Substrate.
                                        This means that the Plasm Network will be connected to Polkadot in the future.
                                        Our platform is scalable because we are implementing layer2 solutions such as Plasma and Lightning Network.
                                        It aims at improving smart contract performance and the main platform for developing layer2 applications.
                                        For details regarding the specs for the Plasm Network,
                                        please refer to our <a href='https://github.com/staketechnologies/plasmdocs/blob/master/wp/en.pdf'>white paper</a>.
                                        <br />
                                        <IonChip>
                                            <CountdownTimer deadline={endDate}></CountdownTimer>
                                        </IonChip>
                                        until closing.
                                    </IonCardContent>
                                </IonCard>
                                <IonButton size='large' expand="block" href='/lockdrop'>Start Lockdrop</IonButton>
                            </div>
                        </IonCol>
                        <IonCol>

                        </IonCol>
                    </IonRow>
                </IonGrid>

            </IonContent>


        </IonPage >
    )
}

export default LandingPage;