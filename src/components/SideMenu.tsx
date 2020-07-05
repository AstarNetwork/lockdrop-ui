/* eslint-disable react/prop-types */
import React from 'react';
import { IonMenu, IonListHeader, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterLink } from '@ionic/react';
import { Links } from '../data/links';
import homeIcon from '../resources/home-outline.svg';
import twitter from '../resources/logo-twitter.svg';
import discord from '../resources/logo-discord.svg';
import telegram from '../resources/logo-telegram.svg';
import github from '../resources/logo-github.svg';
import { firstLock, secondLock, dustyLock } from '../data/lockInfo';
import { LockMenu } from '../types/LockdropModels';

interface Props {
    headerText: string;
    menuItems: LockMenu[];
}
const MenuSection: React.FC<Props> = ({ headerText, menuItems }) => {
    return (
        <IonList>
            <IonListHeader>{headerText}</IonListHeader>
            {menuItems.map((i, index) => (
                <IonRouterLink routerLink={i.uri} key={index}>
                    <IonItem button detail disabled={i.disabled}>
                        <IonIcon src={i.icon} slot="start" />
                        <IonLabel>{i.title}</IonLabel>
                    </IonItem>
                </IonRouterLink>
            ))}
        </IonList>
    );
};

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

                    <MenuSection headerText="First Lockdrop" menuItems={firstLock} />
                    <MenuSection headerText="Second Lockdrop" menuItems={secondLock} />
                    <MenuSection headerText="Dusty Lockdrop" menuItems={dustyLock} />

                    <IonList>
                        <IonListHeader>External Links</IonListHeader>
                        <a href={Links.discord} rel="noopener noreferrer" target="_blank">
                            <IonItem button detail>
                                <IonIcon src={discord} slot="start" />
                                <IonLabel>Discord</IonLabel>
                            </IonItem>
                        </a>
                        <a href={Links.telegram} rel="noopener noreferrer" target="_blank">
                            <IonItem button detail>
                                <IonIcon src={telegram} slot="start" />
                                <IonLabel>Telegram</IonLabel>
                            </IonItem>
                        </a>
                        <a href={Links.twitter} rel="noopener noreferrer" target="_blank">
                            <IonItem button detail>
                                <IonIcon src={twitter} slot="start" />
                                <IonLabel>Twitter</IonLabel>
                            </IonItem>
                        </a>
                        <a href={Links.github} rel="noopener noreferrer" target="_blank">
                            <IonItem button detail>
                                <IonIcon src={github} slot="start" />
                                <IonLabel>Github</IonLabel>
                            </IonItem>
                        </a>
                    </IonList>
                </IonContent>
            </IonMenu>
        </>
    );
};

export default SideMenu;
