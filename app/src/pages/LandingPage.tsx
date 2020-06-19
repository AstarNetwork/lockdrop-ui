import React from 'react';
import {
    IonContent,
    IonPage,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonRouterLink,
} from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import lockdropLogoA from '../resources/ld_logo_a.png';
import lockdropLogoB from '../resources/ld_logo_b.png';
import ethLogo from '../resources/ethereum_logo.svg';
import btcLogo from '../resources/bitcoin_logo.svg';
import { makeStyles } from '@material-ui/core';
import { firstLockdropStart, firstLockdropEnd } from '../data/lockInfo';

// randomize the lockdrop logo
// this is for AB testing the logo
const lockdropLogo = Math.floor(Math.random() * 10) > 5 ? lockdropLogoA : lockdropLogoB;

const useStyles = makeStyles(() => ({
    logoImg: {
        display: 'block',
        maxWidth: '100%',
        width: '20rem',
        height: 'auto',
        marginLeft: 'auto',
        marginRight: 'auto',
        //maxHeight: '500',
    },
}));

export const LandingPage: React.FC = () => {
    const classes = useStyles();

    return (
        <IonPage>
            <Navbar />
            <IonContent>
                <SectionCard maxWidth="lg">
                    <img src={lockdropLogo} alt="" className={classes.logoImg} />
                    <IonCardHeader>
                        <IonCardSubtitle>Plasm Network Lockdrop Web Application</IonCardSubtitle>
                        <IonCardTitle>Plasm Network Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        Lockdrop is a new token distribution mechanism that emphasizes on low risk and fairness to its
                        users. For more details, checkout{' '}
                        <a
                            color="inherit"
                            href="https://medium.com/stake-technologies/what-is-and-how-to-join-the-plasm-network-lockdrop-the-ultimate-guide-e3f4bdec83de"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            this
                        </a>{' '}
                        article,
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>First Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={ethLogo} slot="start" />
                        <IonLabel>Plasm ETH Lock</IonLabel>

                        <IonButton fill="outline" slot="end">
                            <IonRouterLink routerLink="/lock-form/first">View</IonRouterLink>
                        </IonButton>
                    </IonItem>

                    <IonCardContent>
                        Lock Start: {firstLockdropStart.format('YYYY-MM-DD hh:mm').toString()} UTC
                        <br />
                        Lock End: {firstLockdropEnd.format('YYYY-MM-DD hh:mm').toString()} UTC
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Second Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={ethLogo} slot="start" />
                        <IonLabel>Plasm ETH Lock</IonLabel>
                        <IonButton fill="outline" slot="end" disabled={true}>
                            View
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonIcon src={btcLogo} slot="start" />
                        <IonLabel>Plasm BTC Lock</IonLabel>
                        <IonButton fill="outline" slot="end" disabled={true}>
                            View
                        </IonButton>
                    </IonItem>
                    <IonCardContent>
                        Lock Start: TBA
                        <br />
                        Lock End: TBA
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Dusty Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={ethLogo} slot="start" />
                        <IonLabel>Dusty ETH Lock</IonLabel>

                        <IonButton fill="outline" slot="end" disabled>
                            <IonRouterLink routerLink="/lock-form/dusty-eth">View</IonRouterLink>
                        </IonButton>
                    </IonItem>
                    <IonItem>
                        <IonIcon src={btcLogo} slot="start" />
                        <IonLabel>Dusty BTC Lock</IonLabel>

                        <IonButton fill="outline" slot="end" disabled>
                            <IonRouterLink routerLink="/lock-form/dusty-btc">View</IonRouterLink>
                        </IonButton>
                    </IonItem>
                </SectionCard>
                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Dusty Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={btcLogo} slot="start" />
                        <IonLabel>Dusty PoW</IonLabel>

                        <IonButton fill="outline" slot="end"></IonButton>
                    </IonItem>
                </SectionCard>
                <Footer />
            </IonContent>
        </IonPage>
    );
};

export default LandingPage;
