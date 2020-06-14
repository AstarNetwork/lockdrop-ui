import React from 'react';
import {
    IonContent,
    IonPage,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonLabel,
} from '@ionic/react';
import { wifi, wine, warning } from 'ionicons/icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import { Typography, Link, makeStyles, createStyles } from '@material-ui/core';
import quantstampLogo from '../resources/quantstamp-logo.png';

const useStyles = makeStyles(theme =>
    createStyles({
        formRoot: {
            padding: theme.spacing(4, 3, 0),
        },
        txButton: {
            margin: theme.spacing(3),
        },
        formLabel: {
            margin: theme.spacing(2),
        },
        quantLogo: {
            marginRight: theme.spacing(2),
            maxHeight: 20,
            height: '100%',
            verticalAlign: 'middle',
        },
        textBox: {
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    }),
);

export default function DustyBtcLockPage() {
    const classes = useStyles();
    return (
        <>
            <IonPage>
                <Navbar />
                <IonContent>
                    <SectionCard maxWidth="md">
                        <div>
                            <Typography variant="h4" component="h1" align="center">
                                Dusty Plasm Network BTC Lockdrop
                            </Typography>
                            <Typography variant="body2" component="h2" align="center">
                                Audited by{' '}
                                <Link
                                    color="inherit"
                                    href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    <img src={quantstampLogo} alt="" className={classes.quantLogo} />
                                    {/*todo: This is a placeholder auditor, please change this to the actual one after the audit*/}
                                </Link>
                            </Typography>
                        </div>
                        <IonCard>
                            <IonCardHeader>
                                <IonCardSubtitle>Choose your message signing method</IonCardSubtitle>
                                <IonCardTitle>Sign in</IonCardTitle>
                            </IonCardHeader>

                            <IonCardContent>
                                <IonItem button>
                                    <IonIcon icon={wifi} slot="start" />
                                    <IonLabel>Sign in with Trezor</IonLabel>
                                </IonItem>

                                <IonItem button>
                                    <IonIcon icon={wine} slot="start" />
                                    <IonLabel>Sign in with Ledger</IonLabel>
                                </IonItem>

                                <IonItem button>
                                    <IonIcon icon={warning} slot="start" />
                                    <IonLabel>Direct import (Unsafe)</IonLabel>
                                </IonItem>
                            </IonCardContent>
                        </IonCard>
                    </SectionCard>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
}
