/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useMemo, useEffect } from 'react';
import {
    IonPage,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonItemDivider,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonLoading,
} from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Container } from '@material-ui/core';
//import BigNumber from 'bignumber.js';
import { ethDurations, btcDurations } from 'src/data/lockInfo';
import { OptionItem } from 'src/types/LockdropModels';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../helpers/plasmUtils';

const LockdropCalcPage = () => {
    const [tokenType, setTokenType] = useState<'BTC' | 'ETH'>('ETH');
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenExRate, setTokenExRate] = useState<[number, number]>([0, 0]); // 1 token to USD rate
    const [lockDuration, setLockDuration] = useState<OptionItem>();
    const [plasmApi, setPlasmApi] = useState<ApiPromise>();
    const [returnAlpha, setReturnAlpha] = useState(0);

    const [isLoading, setIsLoading] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });

    const tokenLockDurs = useMemo(() => {
        switch (tokenType) {
            case 'BTC':
                return btcDurations;
            case 'ETH':
            default:
                return ethDurations;
        }
    }, [tokenType]);

    useEffect(() => {
        setIsLoading({ loading: true, message: 'Connecting to Plasm Network' });
        (async () => {
            const api = await plasmUtils.createPlasmInstance(plasmUtils.PlasmNetwork.Dusty);
            setPlasmApi(api);

            const networkAlpha = await plasmUtils.getLockdropAlpha(api);
            setReturnAlpha(networkAlpha);
            const rate = await plasmUtils.getCoinRate(api);
            setTokenExRate(rate);
        })().finally(() => {
            setIsLoading({ loading: false, message: '' });
        });
    }, []);

    // fetch lock data in the background
    useEffect(() => {
        const interval = setInterval(async () => {
            if (plasmApi) {
                try {
                    const rates = await plasmUtils.getCoinRate(plasmApi);
                    setTokenExRate(rates);
                } catch (error) {
                    console.log(error);
                }
            }
        }, 5 * 1000);

        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    return (
        <>
            <IonPage>
                <Navbar />
                <IonContent>
                    <IonLoading isOpen={isLoading.loading} message={isLoading.message} />
                    <Container maxWidth="lg">
                        <IonCard>
                            <IonCardHeader>
                                <IonCardSubtitle>How much tokens you will get for each price points</IonCardSubtitle>
                                <IonCardTitle>Lockdrop Reward Calculator</IonCardTitle>
                            </IonCardHeader>

                            <IonCardContent>
                                <IonLabel>
                                    This calculation is based on the current price of each locking tokens. The actual
                                    lockdrop reward is calculated based on the exchange rate of the moment Plasm Network
                                    validator nodes confirm your transaction, which is{' '}
                                    <em>around 1 ~ 2 minutes after you press the claim lockdrop button</em>. Therefore,
                                    the results shown from this page will not reflect the actual number of tokens you
                                    will receive.
                                </IonLabel>

                                <IonList>
                                    <IonItemDivider>Token Information</IonItemDivider>
                                    <IonItem>
                                        <IonLabel>
                                            <p>{tokenExRate[0].toString()} USD per 1 BTC</p>
                                            <p>{tokenExRate[1].toString()} USD per 1 ETH</p>
                                        </IonLabel>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Locking Tokens</IonLabel>
                                        <IonSelect
                                            value={tokenType}
                                            placeholder="Choose One"
                                            onIonChange={e => {
                                                e.detail.value && setTokenType(e.detail.value);
                                            }}
                                        >
                                            <IonSelectOption value="BTC">BTC</IonSelectOption>
                                            <IonSelectOption value="ETH">ETC</IonSelectOption>
                                        </IonSelect>
                                    </IonItem>

                                    <IonItemDivider>Lockdrop information</IonItemDivider>
                                    <IonLabel>Current network token alpha value: {returnAlpha.toString()}</IonLabel>

                                    <IonItem>
                                        <IonLabel position="floating">Number of {tokenType} locking</IonLabel>
                                        <IonInput
                                            placeholder={'ex: 0.64646 ' + tokenType}
                                            onIonChange={e => {
                                                const _input = e.detail.value;
                                                if (_input && isFinite(parseFloat(_input))) {
                                                    setTokenAmount(_input);
                                                }
                                            }}
                                            value={tokenAmount}
                                        ></IonInput>
                                    </IonItem>
                                    <IonLabel>Lock Duration</IonLabel>
                                    <IonItem>
                                        <IonLabel>Locking for...</IonLabel>
                                        <IonSelect
                                            value={lockDuration?.value}
                                            onIonChange={e => {
                                                console.log(e.detail);
                                                e.detail.value && setLockDuration(e.detail.value);
                                            }}
                                        >
                                            {tokenLockDurs.map(dat => {
                                                return (
                                                    <IonSelectOption key={dat.value} value={dat.rate}>
                                                        {dat.label}
                                                    </IonSelectOption>
                                                );
                                            })}
                                        </IonSelect>
                                        <IonChip>
                                            <IonLabel>
                                                {lockDuration
                                                    ? 'The rate is ' + lockDuration.rate + 'x'
                                                    : 'Please choose the duration'}
                                            </IonLabel>
                                        </IonChip>
                                    </IonItem>
                                </IonList>
                            </IonCardContent>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardSubtitle>
                                        How much tokens you will get for each price points
                                    </IonCardSubtitle>
                                    <IonCardTitle>Expected return</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonLabel>
                                        This calculation is based on the current price of each locking tokens. The
                                        actual lockdrop reward is calculated based on the exchange rate of the moment
                                        Plasm Network validator nodes confirm your transaction, which is around 1 ~ 2
                                        minutes after you press the claim lockdrop button. Therefore, the results shown
                                        from this page will not reflect the actual number of tokens you will receive
                                    </IonLabel>
                                </IonCardContent>
                            </IonCard>
                        </IonCard>
                    </Container>
                    <Footer />
                </IonContent>
            </IonPage>
        </>
    );
};

export default LockdropCalcPage;
