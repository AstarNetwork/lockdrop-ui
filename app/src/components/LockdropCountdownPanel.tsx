/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { TimeFormat } from '../models/LockdropModels';
import moment, { Moment, duration } from 'moment';
import { getTotalLockVal, getAllLockEvents } from '../helpers/lockdrop/EthereumLockdrop';

interface Props {
    startTime: Moment;
    endTime: Moment;
}

enum LockState {
    notStart,
    start,
    end,
}

const LockdropCountdownPanel: React.FC<Props> = ({ startTime, endTime }) => {
    const now = moment().utc();

    const calculateTimeLeft = (): TimeFormat => {
        const tillStart = moment(startTime).valueOf() - now.valueOf();

        //let difference = tillStart;
        let difference = duration(startTime.diff(now));

        // if the lockdrop has already started
        if (tillStart < 0) {
            difference = duration(endTime.diff(now));
        }

        let timeLeft: TimeFormat = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        const tillEnd = moment(endTime).valueOf() - now.valueOf();
        // check if the duration has ended
        if (tillEnd > 0) {
            timeLeft = {
                days: difference.days(),
                hours: difference.hours(),
                minutes: difference.minutes(),
                seconds: difference.seconds(),
            };
        }
        return timeLeft;
    };

    const getLockState = (): LockState => {
        const tillStart = moment(startTime).valueOf() - now.valueOf();
        if (tillStart > 0) {
            return LockState.notStart;
        } else if (tillStart <= 0 && !(moment(endTime).valueOf() - now.valueOf() < 0)) {
            return LockState.start;
        } else {
            return LockState.end;
        }
    };

    const [timeLeft, setTimeLeft] = useState<TimeFormat>(calculateTimeLeft());
    const [lockState, setLockState] = useState(getLockState());
    const [totalLockVal, setTotalLockVal] = useState('0');

    const getLockValue = async (): Promise<void> => {
        try {
            const allLocks = await getAllLockEvents(window.web3, window.contract);
            const totalLockVal = await getTotalLockVal(allLocks, window.web3);
            setTotalLockVal(totalLockVal);
            // const url =
            //     'https://api.etherscan.io/api?module=account&action=txlist&address=0x458dabf1eff8fcdfbf0896a6bd1f457c01e2ffd6&startblock=0&endblock=latest&sort=asc';

            // const res = await fetch(url);
            // const data = await res.json();
            // const result: LockTxArray = data.result;
            // let totalVal = new BigNumber(0);

            // // Memo: forEach will occur `forEach Is Not a Function` error sometime
            // for (let i = 0; i < result.length; i++) {
            //     const txVal = new BigNumber(result[i].value);
            //     totalVal = totalVal.plus(txVal);
            // }

            // // Memo: Recursion
            // if (totalVal.s !== null) {
            //     setTotalLockVal(
            //         Number(new BigNumber(Web3Utils.fromWei(totalVal.toFixed(), 'ether')).decimalPlaces(1).toFixed()),
            //     );
            // } else {
            //     getLockValue();
            // }
        } catch (err) {
            console.error(err);
        }
    };
    // update time value every second
    useEffect(() => {
        setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
            setLockState(getLockState());
        }, 1000);

        setTimeout(async () => {
            await getLockValue();
        }, 1000);
    });

    if (lockState !== LockState.end) {
        return (
            <>
                <PanelWrapper>
                    <div className="time">
                        <Grid container spacing={2} justify="center">
                            <Grid item>
                                {lockState === LockState.notStart ? (
                                    <Typography variant="h4" component="h2">
                                        Main Network Lockdrop Starting in:
                                    </Typography>
                                ) : (
                                    <Typography variant="h4" component="h2">
                                        Lockdrop Ending in:
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item>
                                <h3>{timeLeft.days}</h3>
                                <p>Days</p>
                            </Grid>
                            <Grid item>
                                <h3>{timeLeft.hours}</h3>
                                <p>Hours</p>
                            </Grid>
                            <Grid item>
                                <h3>{timeLeft.minutes}</h3>
                                <p>Minutes</p>
                            </Grid>
                            <Grid item>
                                <h3>{timeLeft.seconds}</h3>
                                <p>Seconds</p>
                            </Grid>
                        </Grid>
                    </div>
                </PanelWrapper>
            </>
        );
    } else {
        return (
            <>
                <PanelWrapper>
                    <Typography variant="h2" component="h1" align="center">
                        Main Network Lockdrop has ended
                    </Typography>
                    <Typography variant="h3" component="h3" align="center">
                        Total Locked Value: {totalLockVal} ETH
                    </Typography>
                </PanelWrapper>
            </>
        );
    }
};

export default LockdropCountdownPanel;

const PanelWrapper: React.FC = ({ children }) => {
    const useStyles = makeStyles(theme => ({
        container: {
            padding: theme.spacing(5, 2, 0),
            margin: theme.spacing(1),
        },
    }));

    const classes = useStyles();

    return (
        <>
            <Container maxWidth="lg" className={classes.container}>
                {children}
            </Container>
        </>
    );
};
