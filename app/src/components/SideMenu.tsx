import React from 'react';
import { IonMenu, IonListHeader, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterLink } from '@ionic/react';
import { Links } from '../data/links';
import homeIcon from '../resources/home-outline.svg';
import twitter from '../resources/logo-twitter.svg';
import discord from '../resources/logo-discord.svg';
import telegram from '../resources/logo-telegram.svg';
import github from '../resources/logo-github.svg';
import { firstLock, secondLock, dustyLock } from '../data/lockInfo';

const SideMenu: React.FC = () => {
    return (
        <>
            <IonMenu contentId="main">
                <IonListHeader>Sitemap</IonListHeader>
                <IonContent>
                    <IonList>
                        <IonRouterLink routerLink="/lock-form">
                            <IonItem button detail>
                                <IonIcon src={homeIcon} slot="start" />
                                <IonLabel>Home</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonList>
                    <IonList>
                        <IonListHeader>First Lockdrop</IonListHeader>
                        {firstLock.map((i, index) => (
                            <IonRouterLink routerLink={i.uri} key={index}>
                                <IonItem button detail>
                                    <IonIcon src={i.icon} slot="start" />
                                    <IonLabel>{i.title}</IonLabel>
                                </IonItem>
                            </IonRouterLink>
                        ))}
                    </IonList>
                    <IonList>
                        <IonListHeader>Second Lockdrop</IonListHeader>
                        {secondLock.map((i, index) => (
                            <IonRouterLink routerLink={i.uri} key={index}>
                                <IonItem button disabled detail>
                                    <IonIcon src={i.icon} slot="start" />
                                    <IonLabel>{i.title}</IonLabel>
                                </IonItem>
                            </IonRouterLink>
                        ))}

                        {/* <IonRouterLink routerLink="/lock-form/first">
                            <IonItem button disabled detail>
                                <IonIcon src={ethLogo} slot="start" />
                                <IonLabel>ETH Lock</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                        <IonRouterLink routerLink="/lock-form/first">
                            <IonItem button disabled detail>
                                <IonIcon src={btcLogo} slot="start" />
                                <IonLabel>BTC Lock</IonLabel>
                            </IonItem>
                        </IonRouterLink> */}
                    </IonList>

                    <IonList>
                        <IonListHeader>Dusty Lockdrop</IonListHeader>
                        {dustyLock.map((i, index) => (
                            <IonRouterLink routerLink={i.uri} key={index}>
                                <IonItem button detail>
                                    <IonIcon src={i.icon} slot="start" />
                                    <IonLabel>{i.title}</IonLabel>
                                </IonItem>
                            </IonRouterLink>
                        ))}
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
