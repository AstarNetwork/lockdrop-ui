import React, { useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import { Typography, Link, makeStyles, createStyles } from '@material-ui/core';
import quantstampLogo from '../resources/quantstamp-logo.png';
import BtcRawSignature from '../components/BtcLock/BtcRawSignature';
//import TrezorConnect, { DEVICE } from 'trezor-connect';
import * as bitcoinjs from 'bitcoinjs-lib';

const useStyles = makeStyles(theme =>
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
    // const [isLoading, setLoading] = useState<{
    //     loadState: boolean;
    //     message: string;
    // }>({
    //     loadState: false,
    //     message: '',
    // });

    // connect to plasm node on mount
    useEffect(() => {
        // setLoading({
        //     loadState: true,
        //     message: 'Connecting to Plasm Network',
        // });
        // plasmUtils
        //     .createPlasmInstance(plasmUtils.PlasmNetwork.Dusty)
        //     .then(e => {
        //         setPlasmApi(e);
        //         console.log('connected to Plasm network');
        //     })
        //     .catch(err => {
        //         toast.error(err);
        //         console.log(err);
        //     })
        //     .finally(() => {
        //         setLoading({
        //             loadState: false,
        //             message: '',
        //         });
        //     });
    }, []);

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
                                </Link>
                            </Typography>
                        </div>
                        <BtcRawSignature networkType={bitcoinjs.networks.testnet} />
                    </SectionCard>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
}
