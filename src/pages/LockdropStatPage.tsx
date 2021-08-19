// TODOD check app complaining about unused React import
/* eslint-disable */
// @ts-ignore
import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import Navbar from '../components/Navbar';
import { makeStyles, createStyles } from '@material-ui/core';

const useStyles = makeStyles(() =>
    createStyles({
        staticPage: {
            maxHeight: 'auto',
            width: '100%',
            height: '100%',
        },
        pageContent: {
            // used for hiding the second scrollbar
            overflow: 'hidden',
            maxHeight: 'auto',
            width: '100%',
            height: '100%',
        },
    }),
);

/**
 * This is the ugliest thing I have done in my entire carrier.
 * But in order to use a static html page within react without having to make things from scratch,
 * importing the entire site via iframe was the only option.
 * It is costly, inefficient, and just bad coding, but it works like a charm.
 * Please forgive me everyone.
 */
export default function LockdropStatPage() {
    const classes = useStyles();

    // to reduce the package size, the statistic page is hosted on a remote server
    // https://github.com/hoonsubin/lockdrop-stat-page
    return (
        <>
            <IonPage>
                <Navbar />
                <IonContent>
                    <div className={classes.pageContent}>
                        <iframe
                            src="https://hoonsubin.github.io/lockdrop-stat-page/"
                            title="Iframe Example"
                            className={classes.staticPage}
                            frameBorder="0"
                        >
                            Browser not compatible
                        </iframe>
                    </div>
                </IonContent>
            </IonPage>
        </>
    );
}
