/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading, IonButton } from '@ionic/react';
import React from 'react';
import LockdropForm from '../components/EthLock/LockdropForm';
import { connectWeb3, getAllLockEvents, submitLockTx, getPubKey } from '../helpers/lockdrop/EthereumLockdrop';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent, LockdropType, Lockdrop } from '../types/LockdropModels';
import LockedEthList from '../components/EthLock/LockedEthList';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { removeWeb3Event } from '../helpers/getWeb3';
import SectionCard from '../components/SectionCard';
import { Typography, Container } from '@material-ui/core';
import * as plasmUtils from '../helpers/plasmUtils';
import { ApiPromise } from '@polkadot/api';
import * as polkadotUtil from '@polkadot/util-crypto';
import ClaimStatus from 'src/components/ClaimStatus';

const formInfo = `This is the lockdrop form for Ethereum.
This uses Web3 injection so you must have Metamask (or other Web3-enabled wallet) installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.
Regarding the audit by Quantstamp, click <a
                            color="inherit"
                            href="https://github.com/staketechnologies/lockdrop-ui/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf"
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            here
                        </a> for more details`;

interface PageStates {
    web3: Web3;
    plasmApi: ApiPromise;
    accounts: string[];
    contract: Contract;
    isLoading: boolean;
    networkType: string;
    isProcessing: boolean;
    allLockEvents: LockEvent[];
    lockParams: Lockdrop[] | undefined;
    error: null;
    fetchingLockData: boolean;
    publicKey: string;
}

toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

class DustyEthLockPage extends React.Component<{}, PageStates> {
    constructor(props: {}) {
        super(props);
        // initialize with null values
        this.state = {
            web3: {} as Web3,
            plasmApi: {} as ApiPromise,
            accounts: [''],
            contract: {} as Contract,
            isLoading: true,
            networkType: '',
            isProcessing: false,
            allLockEvents: [],
            lockParams: [],
            error: null,
            fetchingLockData: true,
            publicKey: '',
        };
    }

    // used for fetching data periodically
    timerInterval: any;

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        try {
            const web3State = await connectWeb3('secondLock');
            this.setState(web3State);
            const plasmNode = await plasmUtils.createPlasmInstance(plasmUtils.PlasmNetwork.Local);
            this.setState({ plasmApi: plasmNode });

            // checks if account has changed in MetaMask
            if ((window as any).ethereum.on) {
                (window as any).ethereum.on('accountsChanged', this.handleAccountChange);
            }

            this.setState({ networkType: await this.state.web3.eth.net.getNetworkType() });
        } catch (e) {
            this.setState({ error: e });
        }

        this.timerInterval = setInterval(() => {
            this.getLockData().then(() => {
                this.setState({ isLoading: false });
            });
        }, 5000);
    };

    isMainnet = () => {
        return this.state.networkType === 'main';
    };

    componentWillUnmount = () => {
        clearInterval(this.timerInterval);
        removeWeb3Event();
    };

    // called when the user changes MetaMask account
    handleAccountChange = () => {
        // refresh the page
        window.location.reload(false);
    };

    getLockData = async () => {
        try {
            // get all the lock events from the chain
            const _allLocks = await getAllLockEvents(this.state.web3, this.state.contract);
            const _lockParam = this.getClaimParams();

            this.setState({ allLockEvents: _allLocks, lockParams: _lockParam });
        } catch (error) {
            this.setState({ error });
            console.log(error);
        }
    };

    setPublicKey = () => {
        if (!this.state.publicKey) {
            getPubKey(
                this.state.web3,
                `Sign this message to submit a lock request.
                This action is required for the real-time lockdrop module
                ${polkadotUtil.randomAsHex(3)}`,
            ).then(pub => {
                this.setState({ publicKey: pub });
            });
        }
    };

    /**
     * Obtains list of lockdrop claim parameters
     */
    getClaimParams = () => {
        if (this.state.publicKey) {
            const userLocks = this.state.allLockEvents.filter(i => i.lockOwner === this.state.accounts[0]);
            const claimIDs = userLocks.map(lock => {
                const _param = plasmUtils.createLockParam(
                    LockdropType.Ethereum,
                    lock.transactionHash,
                    this.state.publicKey,
                    lock.duration.toString(),
                    Web3.utils.toWei(lock.eth, 'ether').toString(),
                );
                return plasmUtils.structToLockdrop(_param as any);
            });

            return claimIDs;
        }
    };

    handleSubmit = async (formInputVal: LockInput) => {
        this.setState({ isProcessing: true });
        try {
            if (!this.state.publicKey) {
                const _publicKey = await getPubKey(
                    this.state.web3,
                    `Sign this message to submit a lock request.
                This action is required for the real-time lockdrop module
                ${polkadotUtil.randomAsHex(3)}`,
                );

                this.setState({ publicKey: _publicKey });
            }

            const hash = await submitLockTx(formInputVal, this.state.accounts[0], this.state.contract);

            const lockParam = plasmUtils.createLockParam(
                LockdropType.Ethereum,
                hash,
                this.state.publicKey,
                formInputVal.duration.toString(),
                Web3.utils.toWei(formInputVal.amount, 'ether').toString(),
            );
            const nonce = plasmUtils.claimPowNonce(lockParam.hash);
            console.log('Your claim ID is ' + lockParam.hash.toString());
            // we need to wrap the struct into a any type due to type overloading issues
            await plasmUtils.sendLockClaim(this.state.plasmApi, lockParam as any, nonce);
            toast.success(`Successfully locked ${formInputVal.amount} ETH for ${formInputVal.duration} days!`);
        } catch (e) {
            toast.error(e.message.toString());
            console.log(e);
        }

        this.setState({ isProcessing: false });
    };

    render() {
        return (
            <IonPage>
                <Navbar />
                <IonContent>
                    <>
                        {this.state.error ? <p>{this.state.error}</p> : null}
                        {this.state.isLoading ? (
                            <IonLoading isOpen={true} message={'Connecting to Wallet and fetching chain data...'} />
                        ) : (
                            <>
                                {this.state.isProcessing && (
                                    <IonLoading
                                        isOpen={this.state.isProcessing}
                                        message={'Processing Transaction...'}
                                    />
                                )}

                                {this.isMainnet() ? (
                                    <SectionCard maxWidth="lg">
                                        <Typography variant="h2" component="h4" align="center">
                                            Please access this page with a Ethereum testnet wallet
                                        </Typography>
                                    </SectionCard>
                                ) : (
                                    <>
                                        <LockdropForm
                                            token="ETH"
                                            onSubmit={this.handleSubmit}
                                            description={formInfo}
                                            dusty
                                        />

                                        <SectionCard maxWidth="lg">
                                            <Typography variant="h4" component="h1" align="center">
                                                Real-time Lockdrop Status
                                            </Typography>
                                            {this.state.publicKey ? (
                                                <ClaimStatus
                                                    claimParams={this.state.lockParams}
                                                    plasmApi={this.state.plasmApi}
                                                    networkType="ETH"
                                                />
                                            ) : (
                                                <>
                                                    <Container>
                                                        <IonButton expand="block" onClick={() => this.setPublicKey()}>
                                                            Click to view lock claims
                                                        </IonButton>
                                                    </Container>
                                                </>
                                            )}
                                        </SectionCard>

                                        <LockedEthList
                                            web3={this.state.web3}
                                            accounts={this.state.accounts}
                                            lockData={this.state.allLockEvents}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </>
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default DustyEthLockPage;
