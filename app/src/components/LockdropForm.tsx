import { IonLabel, IonButton, IonItem, IonInput, IonCard, IonCardContent, IonChip } from '@ionic/react';
import React, { useState } from 'react';
import { LockInput } from '../models/LockdropModels';
import SectionCard from './SectionCard';
import { DropdownOption, OptionItem } from '../components/DropdownOption';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

type InputProps = {
    token: string;
    onSubmit: Function;
    description?: string;
};

// used to define the content of the dropdown menu
const durations: OptionItem[] = [
    { label: '30 Days', value: 30 },
    { label: '100 Days', value: 100 },
    { label: '300 Days', value: 300 },
    { label: '1000 Days', value: 1000 },
];

//const txTypes: OptionItem[] = [{ label: 'Web3 Wallet', value: 'web3' }];

// the token increase rate for lock durations
const rates = [
    { key: 30, value: 24 },
    { key: 100, value: 100 },
    { key: 300, value: 360 },
    { key: 1000, value: 1600 },
];

// the main component function
const LockdropForm = ({ token, onSubmit, description }: InputProps) => {
    // states used in this component
    const [lockAmount, setAmount] = useState(0);
    const [lockDuration, setDuration] = useState(0);
    const [affAccount, setAff] = useState('');
    const [txType] = useState('');

    const useStyles = makeStyles(theme => ({
        txButton: {
            margin: theme.spacing(3),
        },
        formLabel: {
            margin: theme.spacing(2),
        },
    }));

    const classes = useStyles();

    function getTokenRate() {
        if (lockDuration) {
            return rates.filter(x => x.key === lockDuration)[0].value;
        }
        return 0;
    }

    // the submit button function
    function handleSubmit() {
        const inputs: LockInput = {
            duration: lockDuration,
            amount: lockAmount,
            affiliation: affAccount,
            txMethod: txType,
            rate: getTokenRate(),
        };
        onSubmit(inputs);
    }

    // main render JSX
    return (
        <>
            <SectionCard maxWidth="lg">
                <div className="main-content">
                    <IonLabel className={classes.formLabel}>Form Inputs</IonLabel>
                    {description ? (
                        <IonCard>
                            <IonCardContent>{description}</IonCardContent>
                        </IonCard>
                    ) : (
                        <div></div>
                    )}

                    <IonItem>
                        <IonLabel position="floating">Number of {token}</IonLabel>
                        <IonInput
                            placeholder={'ex: 0.64646 ' + token}
                            onIonInput={e => setAmount(((e.target as HTMLInputElement).value as unknown) as number)}
                        ></IonInput>
                    </IonItem>
                    <IonLabel className={classes.formLabel}>Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={durations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setDuration((e.target.value as unknown) as number)
                            }
                        ></DropdownOption>
                        <IonChip>
                            <IonLabel>
                                {lockDuration ? 'The rate is ' + getTokenRate() + 'x' : 'Please choose the duration'}
                            </IonLabel>
                        </IonChip>
                    </IonItem>

                    <IonItem>
                        <IonCard>
                            <IonCardContent>
                                If you have a friend who is also participating in the lockdrop, please input the
                                address. Both parties will be able to receive a bonus rate of 1% of what the friend is
                                receiving. Checkout this{' '}
                                <a href="https://medium.com/stake-technologies/lockdrop-with-friends-the-plasm-network-affiliation-program-b385c1cd800d">
                                    article
                                </a>{' '}
                                for details.
                            </IonCardContent>
                        </IonCard>
                        <IonLabel position="floating">Affiliation (optional)</IonLabel>

                        <IonInput
                            placeholder={'ex: 0x324632...'}
                            onIonInput={e => setAff((e.target as HTMLInputElement).value)}
                        ></IonInput>
                    </IonItem>
                    <Container>
                        <IonButton expand="block" onClick={() => handleSubmit()} className={classes.txButton}>
                            Submit Transaction
                        </IonButton>
                    </Container>
                </div>
            </SectionCard>
        </>
    );
};

export default LockdropForm;
