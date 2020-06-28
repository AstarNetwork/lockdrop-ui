import React, { useState } from 'react';
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
import { warning } from 'ionicons/icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import { Typography, Link, makeStyles, createStyles } from '@material-ui/core';
import quantstampLogo from '../resources/quantstamp-logo.png';
import trezorLogo from '../resources/trezor_logo.svg';
import ledgerLogo from '../resources/ledger_logo.svg';
import TrezorConnect from 'trezor-connect';
import { initTrezor } from '../helpers/lockdrop/BitcoinLockdrop';
import { BtcWalletType, BtcNetwork } from '../types/LockdropModels';
import BtcRawSignature from '../components/BtcLock/BtcRawSignature';

const useStyles = makeStyles((theme) =>
    createStyles({
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

    const [walletType, setWalletType] = useState<BtcWalletType>(BtcWalletType.None);

    const handleTrezor = async () => {
        if (initTrezor()) {
            const address = await TrezorConnect.getAddress({ path: "m/49'/0/'0'" });
            console.log('logging in to trezor' + address.success + walletType);
            setWalletType(BtcWalletType.Trezor);
        } else {
            console.log('failed to login to trezor');
        }
    };
    const handleLedger = () => {
        console.log('logging in to Ledger');
        setWalletType(BtcWalletType.Ledger);
    };
    const handleRawTx = () => {
        console.log('logging in to raw transaction');
        setWalletType(BtcWalletType.Raw);
    };

    const ChangeSignView: React.FC = () => {
        switch (walletType) {
            default:
            case BtcWalletType.None:
                return (
                    <>
                        <IonCard>
                            <IonCardHeader>
                                <IonCardSubtitle>Choose your message signing method</IonCardSubtitle>
                                <IonCardTitle>Sign in</IonCardTitle>
                            </IonCardHeader>

                            <IonCardContent>
                                <IonItem button onClick={() => handleTrezor()} disabled>
                                    <IonIcon icon={trezorLogo} slot="start" />
                                    <IonLabel>Sign in with Trezor</IonLabel>
                                </IonItem>

                                <IonItem button onClick={() => handleLedger()} disabled>
                                    <IonIcon icon={ledgerLogo} slot="start" />
                                    <IonLabel>Sign in with Ledger</IonLabel>
                                </IonItem>

                                <IonItem button onClick={() => handleRawTx()}>
                                    <IonIcon icon={warning} slot="start" />
                                    <IonLabel>Direct sign</IonLabel>
                                </IonItem>
                            </IonCardContent>
                        </IonCard>
                    </>
                );
            case BtcWalletType.Raw:
                return <BtcRawSignature networkType={BtcNetwork.TestNet} />;
        }
    };

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
                        <ChangeSignView />
                    </SectionCard>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
}
