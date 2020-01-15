import {
    IonLabel,
    IonContent,
    IonPage,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonButton,
    IonCol,
    IonGrid,
    IonRow,
    IonItem,
    IonInput,
    IonCard,
    IonCardContent,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import React from 'react';
import './LockdropPage.css';

type OptionData = {
    dataSets: string[];
}

const contractAddress = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
const durations: string[] = ['3 Months', '6 Months', '12 Months', 'Forever my dear!'];
const txType: string[] = ['Metamask', 'Plasm CLI', 'MYCrypto'];
const tokenTypes: string[] = ['ETH', 'BTC', 'DOT'];


const DropdownOption = (props: OptionData) => {
    const items = props.dataSets.map(x => {
        return (
            <IonSelectOption className='dropdown-item' key={props.dataSets.indexOf(x)}>{x}</IonSelectOption>
        );
    });

    return <IonSelect interface='popover'>{items}</IonSelect>;
};

const LockdropPage: React.FC = () => {
    return (
        <IonPage>
            <IonHeader translucent>
                <IonToolbar>
                    <IonTitle>Lockdrop Form</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonGrid>
                    <IonRow>
                        <IonCol>

                        </IonCol>
                        <IonCol size='auto'>
                            <div className='main-content'>


                                <IonLabel>Lockdrop Contract Address</IonLabel>

                                <IonCard>
                                    <IonCardContent>{contractAddress}</IonCardContent>
                                </IonCard>
                                <IonItem>
                                    <IonLabel>Tokens Locking</IonLabel>
                                    <DropdownOption dataSets={tokenTypes}></DropdownOption>
                                </IonItem>
                                <IonItem>
                                    <IonLabel position="floating">PLM Public Key (hex)</IonLabel>
                                    <IonInput placeholder='e.g. 0x12ba5...'></IonInput>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Lock Duration</IonLabel>
                                    <DropdownOption dataSets={durations}></DropdownOption>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Transaction Type</IonLabel>
                                    <DropdownOption dataSets={txType}></DropdownOption>
                                </IonItem>
                                <IonButton>Submit Transaction</IonButton>

                            </div>
                        </IonCol>
                        <IonCol>

                        </IonCol>
                    </IonRow>
                </IonGrid>

            </IonContent>


        </IonPage >
    )
}

export default LockdropPage;