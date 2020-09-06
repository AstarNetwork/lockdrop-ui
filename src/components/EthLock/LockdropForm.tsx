import { IonLabel, IonButton, IonItem, IonInput, IonCard, IonCardContent, IonChip, IonImg } from '@ionic/react';
import React, { useState } from 'react';
import { LockInput, OptionItem } from '../../types/LockdropModels';
import SectionCard from '../SectionCard';
import { DropdownOption } from '../DropdownOption';
import Container from '@material-ui/core/Container';
import { Typography, Link } from '@material-ui/core';
import quantstampLogo from '../../resources/quantstamp-logo.png';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { ethDurations, ethDustyDurations } from '../../data/lockInfo';
import { BN } from 'ethereumjs-util';

type InputProps = {
    onSubmit: (inputs: LockInput) => void;
    dusty?: boolean;
};
// the main component function
const LockdropForm = ({ onSubmit, dusty }: InputProps) => {
    // states used in this component
    const [lockAmount, setAmount] = useState<BN>(new BN(0));
    const [lockDuration, setDuration] = useState<OptionItem>({ label: '', value: 0, rate: 0 });
    const [affAccount, setAff] = useState('');

    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            formRoot: {
                padding: theme.spacing(4, 3, 0),
            },
            formLabel: {
                margin: theme.spacing(2),
            },
            quantLogo: {
                marginRight: theme.spacing(2),
                maxHeight: '100%',
                height: 30,
                verticalAlign: 'middle',
            },
            textBox: {
                marginLeft: 'auto',
                marginRight: 'auto',
            },
        }),
    );

    const classes = useStyles();

    // the submit button function
    function handleSubmit() {
        const inputs: LockInput = {
            duration: lockDuration.value,
            amount: lockAmount,
            affiliation: affAccount,
            rate: lockDuration.rate,
        };
        onSubmit(inputs);
    }

    // main render JSX
    return (
        <>
            <SectionCard maxWidth="lg">
                <div className={classes.formRoot}>
                    <Typography variant="h4" component="h1" align="center">
                        {dusty ? 'Dusty Plasm' : 'Plasm Main'} Network Ethereum Lockdrop
                    </Typography>
                    <div>
                        <Typography variant="body2" component="h2" align="center">
                            Audited by
                        </Typography>
                        <Link
                            color="inherit"
                            href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <IonImg src={quantstampLogo} alt="" className={classes.quantLogo} />
                        </Link>
                    </div>

                    <IonCard className={classes.textBox}>
                        <IonCardContent>
                            This is the lockdrop form for Ethereum. This uses Web3 injection so you must access this
                            page with a dApp browser or extension installed in order for this to work properly. If you
                            find any errors or find issues with this form, please contact the Plasm team. Regarding the
                            audit by Quantstamp, click{' '}
                            <a
                                color="inherit"
                                href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                here
                            </a>{' '}
                            for more details
                        </IonCardContent>
                    </IonCard>

                    <IonItem>
                        <IonLabel position="floating">Number of ETH</IonLabel>
                        <IonInput
                            placeholder={'ex: 0.64646 ETH'}
                            onIonInput={e =>
                                setAmount(new BN(((e.target as HTMLInputElement).value as unknown) as string))
                            }
                        ></IonInput>
                    </IonItem>
                    <IonLabel className={classes.formLabel}>Lock Duration</IonLabel>
                    <IonItem>
                        <DropdownOption
                            dataSets={dusty ? ethDustyDurations : ethDurations}
                            onChoose={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const durationSet = dusty ? ethDustyDurations : ethDurations;
                                setDuration(
                                    durationSet.filter(i => i.value === ((e.target.value as unknown) as number))[0],
                                );
                            }}
                        ></DropdownOption>
                        <IonChip>
                            <IonLabel>
                                {lockDuration.value
                                    ? 'The rate is ' + lockDuration.rate + 'x'
                                    : 'Please choose the duration'}
                            </IonLabel>
                        </IonChip>
                    </IonItem>

                    <IonItem>
                        <IonCard className={classes.textBox}>
                            <IonCardContent>
                                If you have a friend who is also participating in the lockdrop and is part of our
                                affiliation program, please input the address. Both parties will be able to receive a
                                bonus rate of 1% of what the friend is receiving. Checkout this{' '}
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
                        <IonButton expand="block" onClick={() => handleSubmit()}>
                            Submit Transaction
                        </IonButton>
                    </Container>
                </div>
            </SectionCard>
        </>
    );
};

export default LockdropForm;
