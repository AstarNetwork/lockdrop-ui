import React, { useState, useEffect, useMemo } from 'react';
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
    IonImg,
} from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import lockdropLogoA from '../resources/ld_logo_a.png';
import lockdropLogoB from '../resources/ld_logo_b.png';
import ethLogo from '../resources/ethereum_logo.svg';
import { makeStyles } from '@material-ui/core';
import { firstLockdropStart, firstLockdropEnd, secondLockdropStart, secondLockdropEnd } from '../data/lockInfo';
import TosAgreementModal from 'src/components/TosAgreementModal';
//import moment from 'moment';
import momentTimezone from 'moment-timezone';

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

    // user session storage to store TOS state
    const [userAgreed, setUserAgreed] = useState(localStorage.getItem('AgreedState') || 'false');

    // save session every time the agreement state changes
    useEffect(() => {
        localStorage.setItem('AgreedState', userAgreed.toString());
    }, [userAgreed]);

    const timezone = useMemo(() => {
        const zoneName = momentTimezone.tz.guess();
        const timezone = momentTimezone.tz(zoneName).zoneAbbr();
        return timezone;
    }, []);

    return (
        <IonPage>
            <Navbar />
            <TosAgreementModal
                showModal={!userAgreed.includes('true')}
                // we convert the boolean to string (because browser session)
                onAgree={(ev: boolean) => setUserAgreed(ev ? 'true' : 'false')}
            />
            <IonContent>
                <SectionCard maxWidth="lg">
                    <IonImg src={lockdropLogo} alt="" className={classes.logoImg} />
                    {/* <img src={lockdropLogo} alt="" className={classes.logoImg} /> */}
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
                        Lock Start: {firstLockdropStart.format('YYYY-MM-DD hh:mm').toString()} {timezone}
                        <br />
                        Lock End: {firstLockdropEnd.format('YYYY-MM-DD hh:mm').toString()} {timezone}
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Second Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={ethLogo} slot="start" />
                        <IonLabel>Plasm ETH Lock</IonLabel>
                        <IonButton fill="outline" slot="end">
                            <IonRouterLink routerLink="/lock-form/second-eth">View</IonRouterLink>
                        </IonButton>
                    </IonItem>

                    {/* <IonItem>
                        <IonIcon src={btcLogo} slot="start" />
                        <IonLabel>Plasm BTC Lock</IonLabel>
                        <IonButton fill="outline" slot="end" disabled={true}>
                            View
                        </IonButton>
                    </IonItem> */}
                    <IonCardContent>
                        Lock Start: {secondLockdropStart.format('YYYY-MM-DD hh:mm').toString()} {timezone}
                        <br />
                        Lock End: {secondLockdropEnd.format('YYYY-MM-DD hh:mm').toString()} {timezone}
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Dusty Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon src={ethLogo} slot="start" />
                        <IonLabel>Dusty ETH Lock</IonLabel>

                        <IonButton fill="outline" slot="end">
                            <IonRouterLink routerLink="/lock-form/dusty-eth">View</IonRouterLink>
                        </IonButton>
                    </IonItem>
                </SectionCard>
                <Footer />
            </IonContent>
        </IonPage>
    );
};

export default LandingPage;
