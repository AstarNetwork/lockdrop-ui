import React from 'react';
import {
    IonPage,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
} from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { pin, wifi, wine, warning, walk } from 'ionicons/icons';
import { Container } from '@material-ui/core';

const LockdropCalcPage = () => {
    return (
        <>
            <IonPage>
                <Navbar />
                <IonContent>
                    <Container maxWidth="lg">
                        <IonCard>
                            <IonCardHeader>
                                <IonCardSubtitle>Card Subtitle</IonCardSubtitle>
                                <IonCardTitle>Card Title</IonCardTitle>
                            </IonCardHeader>

                            <IonCardContent>
                                Keep close to Nature&apos;s heart... and break clear away, once in awhile, and climb a
                                mountain or spend a week in the woods. Wash your spirit clean.
                            </IonCardContent>
                        </IonCard>
                    </Container>

                    <IonCard>
                        <IonItem>
                            <IonIcon icon={pin} slot="start" />
                            <IonLabel>ion-item in a card, icon left, button right</IonLabel>
                            <IonButton fill="outline" slot="end">
                                View
                            </IonButton>
                        </IonItem>

                        <IonCardContent>
                            This is content, without any paragraph or header tags, within an ion-cardContent element.
                        </IonCardContent>
                    </IonCard>
                    <IonCard>
                        <IonItem href="#" className="ion-activated">
                            <IonIcon icon={wifi} slot="start" />
                            <IonLabel>Card Link Item 1 activated</IonLabel>
                        </IonItem>

                        <IonItem href="#">
                            <IonIcon icon={wine} slot="start" />
                            <IonLabel>Card Link Item 2</IonLabel>
                        </IonItem>

                        <IonItem className="ion-activated">
                            <IonIcon icon={warning} slot="start" />
                            <IonLabel>Card Button Item 1 activated</IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonIcon icon={walk} slot="start" />
                            <IonLabel>Card Button Item 2</IonLabel>
                        </IonItem>
                    </IonCard>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
};

export default LockdropCalcPage;
