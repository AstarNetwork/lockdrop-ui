import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';

export default function DustyBtcLockPage() {
    return (
        <>
            <IonPage>
                <Navbar />
                <IonContent>
                    <SectionCard maxWidth="md">
                        <p>Hello World</p>
                    </SectionCard>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
}
