/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { IonContent, IonPage, IonLoading, IonLabel } from '@ionic/react';
import React, { useState, useEffect } from 'react';
import LockdropForm from '../components/LockdropForm';
import { connectWeb3, defaultAffiliation, getLockEvents, defaultAddress } from '../helpers/lockdrop/EthereumLockdrop';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionCard from '../components/SectionCard';
import { Contract } from 'web3-eth-contract';
import { LockInput, LockEvent } from '../models/LockdropModels';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Divider } from '@material-ui/core';

const formInfo = `This is the lockdrop form for Ethereum.
This uses Web3 injection so you must have Metamask (or other Web3-enabled wallet) installed in order for this to work properly.
If you find any errors or find issues with this form, please contact the Plasm team.`;

interface PageStates {
    web3: Web3;
    accounts: string[];
    contract: Contract;
    isLoading: boolean;
}

// need an empty interface to use states (React's generic positioning)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PageProps {}

class EthLockdropPage extends React.Component<PageProps, PageStates> {
    constructor(props: PageProps) {
        super(props);
        // initialize with null values
        this.state = {
            web3: {} as Web3,
            accounts: [''],
            contract: {} as Contract,
            isLoading: true,
        };
    }

    // get and set the web3 state when the component is mounted
    componentDidMount = async () => {
        const web3State = await connectWeb3();
        this.setState(web3State);
        this.setState({ isLoading: false });
    };

    componentWillUnmount = async () => {
        // unsubscribe
    };

    handleSubmit = async (formInputVal: LockInput) => {
        // checks user input
        if (formInputVal.amount && formInputVal.duration) {
            console.log(formInputVal);

            const { accounts, contract } = this.state;
            try {
                // check user input
                if (formInputVal.affiliation === accounts[0]) {
                    alert('You cannot affiliate yourself');
                } else if (formInputVal.affiliation && !Web3.utils.isAddress(formInputVal.affiliation)) {
                    alert('Please input a proper Ethereum address');
                } else {
                    // return a default address if user input is empty
                    const introducer = defaultAffiliation(formInputVal.affiliation);

                    // convert user input to Wei
                    const amountToSend = Web3.utils.toWei(formInputVal.amount, 'ether');

                    // communicate with the smart contract
                    await contract.methods.lock(formInputVal.duration, introducer).send({
                        from: accounts[0],
                        value: amountToSend,
                    });

                    alert(`Locked ${formInputVal.amount} tokens for ${formInputVal.duration} days!`);
                }
            } catch (error) {
                alert('error!\n' + error.message);
            }
        } else {
            //todo: display warning if there is a problem with the input
            alert("you're missing an input!");
        }
    };

    render() {
        return (
            <IonPage>
                <IonContent>
                    <Navbar />
                    {this.state.isLoading ? (
                        <IonLoading isOpen={true} message={'Connecting to Metamask...'} />
                    ) : (
                        <>
                            <LockdropForm token="ETH" onSubmit={this.handleSubmit} description={formInfo} />
                            <LockedEth web3={this.state.web3} />
                        </>
                    )}
                    <Footer />
                </IonContent>
            </IonPage>
        );
    }
}
export default EthLockdropPage;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            maxWidth: 'auto',
            backgroundColor: theme.palette.background.paper,
            position: 'relative',
            overflow: 'auto',
            maxHeight: 360,
        },
        listSection: {
            backgroundColor: 'inherit',
        },
        ul: {
            backgroundColor: 'inherit',
            padding: 0,
        },
    }),
);

interface LockHistroyProps {
    web3: Web3;
}
// component that displays the number of tokens and the duration for the lock via Web3
const LockedEth: React.FC<LockHistroyProps> = ({ web3 }) => {
    const classes = useStyles();
    // we use type any because we don't know the contract event type
    const [lockEvents, setEvents] = useState<LockEvent[]>([]);

    const updateList = () => {
        getLockEvents(web3).then(setEvents);
    };

    useEffect(() => {
        updateList();
    }, []);

    return (
        <>
            <SectionCard maxWidth="md">
                <div className="lockdrop-history">
                    {lockEvents.length > 0 ? (
                        <>
                            <h1>Lockdrop</h1>
                            <List className={classes.root} subheader={<li />}>
                                <li className={classes.listSection}>
                                    <ul className={classes.ul}>
                                        <ListSubheader>You have locked {lockEvents.length} times</ListSubheader>
                                        <Divider />
                                        {lockEvents.map(eventItem => (
                                            <>
                                                <ListItem key={eventItem.lock}>
                                                    <ListItemText>
                                                        <h4>Lock address: {eventItem.lock}</h4>
                                                        <h5>Locked in block no. {eventItem.blockNo}</h5>
                                                        <p>
                                                            Locked {web3.utils.fromWei(eventItem.eth, 'ether')} ETH for{' '}
                                                            {eventItem.duration} days
                                                        </p>
                                                        {eventItem.introducer !== defaultAddress ? (
                                                            <p>Introducer: {eventItem.introducer}</p>
                                                        ) : (
                                                            <p>No introducer</p>
                                                        )}
                                                    </ListItemText>
                                                </ListItem>
                                                <Divider />
                                            </>
                                        ))}
                                    </ul>
                                </li>
                            </List>
                        </>
                    ) : (
                        <IonLabel>No Locks</IonLabel>
                    )}
                </div>
            </SectionCard>
        </>
    );
};
