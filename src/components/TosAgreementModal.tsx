/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { IonModal, IonContent, IonButton, IonLabel, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import ReactMarkdown from 'react-markdown';
import tosContent from '../data/UserAgreement.md';
import { makeStyles, createStyles } from '@material-ui/core';

interface Props {
    showModal: boolean;
    onAgree?: (agreed: boolean) => void;
}

const useStyles = makeStyles(theme =>
    createStyles({
        textBox: {
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: theme.spacing(4),
        },
    }),
);

const TosAgreementModal: React.FC<Props> = ({ showModal, onAgree }) => {
    const classes = useStyles();

    const [toc, setToc] = useState('');

    // load the markdown content as string on component mount
    useEffect(() => {
        fetch(tosContent)
            .then(data => data.text())
            .then(text => {
                setToc(text);
            });
    }, []);

    const handleAgreement = (agree: boolean) => {
        if (onAgree) onAgree(agree);
    };

    return (
        <>
            <IonModal isOpen={showModal} backdropDismiss={false}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Lockdrop Terms of Condition</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
                    <div className={classes.textBox}>
                        <IonLabel>
                            <ReactMarkdown source={toc} escapeHtml={false} />
                        </IonLabel>
                        <IonLabel>
                            <h2>
                                Follow us on{' '}
                                <a href={'https://twitter.com/plasm_network'} rel="noopener noreferrer" target="_blank">
                                    Twitter
                                </a>{' '}
                                and{' '}
                                <a
                                    href={'https://t.me/joinchat/IxHd_BfELvbxC9lUYm_czw'}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    Telegram{' '}
                                </a>
                                for the latest information.
                            </h2>
                        </IonLabel>
                    </div>

                    <IonButton expand="block" onClick={() => handleAgreement(true)}>
                        Agree
                    </IonButton>
                </IonContent>
            </IonModal>
        </>
    );
};

export default TosAgreementModal;
