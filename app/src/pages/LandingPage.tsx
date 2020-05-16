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
} from '@ionic/react';
import { pin, wifi, wine } from 'ionicons/icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import lockdropLogo from '../resources/ld_logo_a.png';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(() => ({
    logoImg: {
        display: 'block',
        maxWidth: '100%',
        width: '45%',
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
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>First Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon icon={pin} slot="start" />
                        <IonLabel>Plasm ETH Lock</IonLabel>
                        <IonButton fill="outline" slot="end">
                            View
                        </IonButton>
                    </IonItem>

                    <IonCardContent>
                        This is content, without any paragraph or header tags, within an ion-cardContent element.
                    </IonCardContent>
                </SectionCard>

                <SectionCard maxWidth="lg">
                    <IonCardHeader>
                        <IonCardTitle>Second Lockdrop</IonCardTitle>
                    </IonCardHeader>
                    <IonItem>
                        <IonIcon icon={wifi} slot="start" />
                        <IonLabel>Plasm ETH Lock</IonLabel>
                        <IonButton fill="outline" slot="end">
                            View
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonIcon icon={wine} slot="start" />
                        <IonLabel>Plasm BTC Lock</IonLabel>
                        <IonButton fill="outline" slot="end">
                            View
                        </IonButton>
                    </IonItem>
                </SectionCard>
                <Footer />
            </IonContent>
        </IonPage>
    );
};

export default LandingPage;
