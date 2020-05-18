import React from 'react';
import { IonMenu, IonListHeader, IonContent, IonList, IonItem, IonIcon, IonLabel } from '@ionic/react';
import { Links } from '../data/links';

import ethLogo from '../resources/ethereum_logo.svg';
import btcLogo from '../resources/bitcoin_logo.svg';
import homeIcon from '../resources/home-outline.svg';
import twitter from '../resources/logo-twitter.svg';
import discord from '../resources/logo-discord.svg';
import telegram from '../resources/logo-telegram.svg';
import github from '../resources/logo-github.svg';

const SideMenu: React.FC = () => {
    return (
        <>
            <IonMenu contentId="main">
                <IonListHeader>Sitemap</IonListHeader>
                <IonContent>
                    <IonList>
                        <IonItem button href="/lock-form" detail>
                            <IonIcon src={homeIcon} slot="start" />
                            <IonLabel>Home</IonLabel>
                        </IonItem>
                    </IonList>
                    <IonList>
                        <IonListHeader>First Lockdrop</IonListHeader>
                        <IonItem button href="/lock-form/first" detail>
                            <IonIcon src={ethLogo} slot="start" />
                            <IonLabel>ETH Lock</IonLabel>
                        </IonItem>
                    </IonList>
                    <IonList>
                        <IonListHeader>Second Lockdrop</IonListHeader>
                        <IonItem button href="/lock-form/first" disabled detail>
                            <IonIcon src={ethLogo} slot="start" />
                            <IonLabel>ETH Lock</IonLabel>
                        </IonItem>
                        <IonItem button href="/lock-form/first" disabled detail>
                            <IonIcon src={btcLogo} slot="start" />
                            <IonLabel>BTC Lock</IonLabel>
                        </IonItem>
                    </IonList>

                    <IonList>
                        <IonListHeader>External Links</IonListHeader>
                        <IonItem button href={Links.discord} detail>
                            <IonIcon src={discord} slot="start" />
                            <IonLabel>Discord</IonLabel>
                        </IonItem>
                        <IonItem button href={Links.telegram} detail>
                            <IonIcon src={telegram} slot="start" />
                            <IonLabel>Telegram</IonLabel>
                        </IonItem>
                        <IonItem button href={Links.twitter} detail>
                            <IonIcon src={twitter} slot="start" />
                            <IonLabel>Twitter</IonLabel>
                        </IonItem>
                        <IonItem button href={Links.github} detail>
                            <IonIcon src={github} slot="start" />
                            <IonLabel>Github</IonLabel>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonMenu>
        </>
    );
};

export default SideMenu;
