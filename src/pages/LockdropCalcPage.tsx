/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
    IonToggle,
} from '@ionic/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Container, Typography } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import { ethDurations, btcDurations } from 'src/data/lockInfo';
import { ApiPromise } from '@polkadot/api';
import * as plasmUtils from '../helpers/plasmUtils';

const LockdropCalcPage = () => {
    const [tokenType, setTokenType] = useState<'BTC' | 'ETH'>('ETH');
    const [tokenAmount, setTokenAmount] = useState('');
    const [tokenExRate, setTokenExRate] = useState<[number, number]>([0, 0]); // 1 token to USD rate
    const [lockDuration, setLockDuration] = useState(0);
    const [plasmApi, setPlasmApi] = useState<ApiPromise>();
    const [returnAlpha, setReturnAlpha] = useState(0);

    const [isCustomRate, setIsCustomRate] = useState(false);
    const [customExRate, setCustomExRate] = useState('');

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
            const api = await plasmUtils.createPlasmInstance(plasmUtils.PlasmNetwork.Main);
            setPlasmApi(api);

            const networkAlpha = await plasmUtils.getLockdropAlpha(api);
            setReturnAlpha(networkAlpha);
            const rate = await plasmUtils.getCoinRate(api);
            setTokenExRate(rate);
        })().finally(() => {
            setIsLoading({ loading: false, message: '' });
        });
        return () => {
            plasmApi && plasmApi.disconnect();
        };
    }, [plasmApi]);

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

    const calculatePlm = useCallback(() => {
        // formula is `alpha * token * USD rate * bonus rate`
        try {
            if (typeof lockDuration === 'undefined') throw new Error('No lock duration selected');
            // check if user toggled custom rate
            const _exRate = isCustomRate
                ? parseInt(customExRate) // use user provided token
                : tokenType === 'BTC' // or use exchange rate for each token
                ? tokenExRate[0]
                : tokenExRate[1];
            const _lockVal = new BigNumber(tokenAmount).times(new BigNumber(_exRate));
            const total = _lockVal.times(new BigNumber(returnAlpha)).times(new BigNumber(lockDuration));
            if (total.isNaN()) throw new Error('Invalid value in the calculation');
            return parseFloat(total.toFixed()).toLocaleString('en');
        } catch (e) {
            return '0';
        }
    }, [tokenType, tokenExRate, lockDuration, returnAlpha, tokenAmount, isCustomRate, customExRate]);

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
                                    <em>around 1 ~ 2 minutes after you press the claim lockdrop button</em>.
                                    <Typography align="center">
                                        Therefore,
                                        <b>
                                            the results shown from this page will not reflect the actual number of
                                            tokens you will receive
                                        </b>
                                        .
                                    </Typography>
                                </IonLabel>

                                <IonList>
                                    <IonItemDivider color="primary">Token Information</IonItemDivider>
                                    <IonLabel>Plasm Network alpha value: {returnAlpha.toString()}</IonLabel>
                                    <IonItem>
                                        <IonLabel>
                                            <p>{tokenExRate[0].toString()} USD per 1 BTC</p>
                                            <p>{tokenExRate[1].toString()} USD per 1 ETH</p>
                                        </IonLabel>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Toggle custom exchange rate</IonLabel>
                                        <IonToggle
                                            checked={isCustomRate}
                                            onIonChange={e => setIsCustomRate(e.detail.checked)}
                                        />
                                    </IonItem>
                                    <IonItem>
                                        {isCustomRate ? (
                                            <>
                                                <IonLabel>Input token exchange rate (USD)</IonLabel>
                                                <IonInput
                                                    placeholder={'ex: 341'}
                                                    onIonChange={e => {
                                                        const _input = e.detail.value;
                                                        if (_input && isFinite(parseFloat(_input))) {
                                                            setCustomExRate(_input);
                                                        }
                                                    }}
                                                    value={customExRate}
                                                ></IonInput>
                                            </>
                                        ) : (
                                            <>
                                                <IonLabel>Locking Token Type</IonLabel>
                                                <IonSelect
                                                    value={tokenType}
                                                    placeholder="Choose One"
                                                    onIonChange={e => {
                                                        e.detail.value && setTokenType(e.detail.value);
                                                    }}
                                                >
                                                    <IonSelectOption value="BTC">BTC</IonSelectOption>
                                                    <IonSelectOption value="ETH">ETH</IonSelectOption>
                                                </IonSelect>
                                            </>
                                        )}
                                    </IonItem>

                                    <IonItemDivider color="primary">Lockdrop data</IonItemDivider>

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
                                        <IonLabel>Locking for</IonLabel>
                                        <IonSelect
                                            value={lockDuration}
                                            onIonChange={e => {
                                                setLockDuration(e.detail.value);
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
                                                {lockDuration !== 0
                                                    ? 'The rate is ' + lockDuration + 'x'
                                                    : 'Please choose the duration'}
                                            </IonLabel>
                                        </IonChip>
                                    </IonItem>
                                </IonList>
                            </IonCardContent>
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardSubtitle>PLM token calculation</IonCardSubtitle>
                                    <IonCardTitle>Expected return</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    <IonLabel>
                                        Lockdrop reward formula:
                                        <Typography variant="h3" component="h4" align="center">
                                            alpha * tokens locked * 1 {tokenType} to USD * duration bonus
                                        </Typography>
                                    </IonLabel>
                                    <IonLabel color="primary">
                                        <Typography variant="h3" component="h1" align="center">
                                            You return is estimated to be: {calculatePlm()} PLM
                                        </Typography>
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
