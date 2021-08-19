/* eslint-disable react/prop-types */
import React from 'react';
import { IonMenu, IonListHeader, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterLink } from '@ionic/react';
import { Links } from '../data/links';
import homeIcon from '../resources/home-outline.svg';
import twitter from '../resources/logo-twitter.svg';
import discord from '../resources/logo-discord.svg';
import telegram from '../resources/logo-telegram.svg';
import github from '../resources/logo-github.svg';
import { firstLock, secondLock } from '../data/pages';
import { LockMenu } from '../types/LockdropModels';
import { calculator, stats } from 'ionicons/icons';

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
                        <IonIcon icon={i.icon} slot="start" />
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
                                <IonIcon icon={homeIcon} slot="start" />
                                <IonLabel>Home</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonList>

                    <MenuSection headerText="First Lockdrop" menuItems={firstLock} />
                    <MenuSection headerText="Second Lockdrop" menuItems={secondLock} />

                    <IonList>
                        <IonListHeader>Lockdrop Utility</IonListHeader>
                        <IonRouterLink routerLink="/utils-calculator">
                            <IonItem button detail>
                                <IonIcon icon={calculator} slot="start" />
                                <IonLabel>Reward Calculator</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                        <IonRouterLink routerLink="/lockdrop-stat">
                            <IonItem button detail>
                                <IonIcon icon={stats} slot="start" />
                                <IonLabel>Lockdrop Statistics</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonList>

                    <IonList>
                        <IonListHeader>External Links</IonListHeader>
                        <IonItem href={Links.discord} rel="noopener noreferrer" target="_blank" detail>
                            <IonIcon icon={discord} slot="start" />
                            <IonLabel>Discord</IonLabel>
                        </IonItem>
                        <IonItem href={Links.telegram} rel="noopener noreferrer" target="_blank" detail>
                            <IonIcon icon={telegram} slot="start" />
                            <IonLabel>Telegram</IonLabel>
                        </IonItem>
                        <IonItem href={Links.twitter} rel="noopener noreferrer" target="_blank" detail>
                            <IonIcon icon={twitter} slot="start" />
                            <IonLabel>Twitter</IonLabel>
                        </IonItem>
                        <IonItem href={Links.github} rel="noopener noreferrer" target="_blank" detail>
                            <IonIcon icon={github} slot="start" />
                            <IonLabel>Github</IonLabel>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonMenu>
        </>
    );
};

export default SideMenu;
