/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { TimeFormat, LockEvent } from '../../types/LockdropModels';
import moment, { Moment, duration } from 'moment';
import { getTotalLockVal } from '../../helpers/lockdrop/EthereumLockdrop';

interface Props {
    startTime: Moment;
    endTime: Moment;
    lockData: LockEvent[];
}

enum LockState {
    notStart,
    start,
    end,
}

const useStyles = makeStyles(theme => ({
    container: {
        padding: theme.spacing(0, 2, 4),
        margin: theme.spacing(1),
    },
    headerText: {
        padding: theme.spacing(1),
    },
}));

const LockdropCountdownPanel: React.FC<Props> = ({ startTime, endTime, lockData }) => {
    const now = moment().utc();
    const classes = useStyles();

    const calculateTimeLeft = (): TimeFormat => {
        const tillStart = startTime.valueOf() - now.valueOf();

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

        const tillEnd = endTime.valueOf() - now.valueOf();
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
        const tillStart = startTime.valueOf() - now.valueOf();
        if (tillStart > 0) {
            return LockState.notStart;
        } else if (tillStart <= 0 && !(endTime.valueOf() - now.valueOf() < 0)) {
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
            const _totalLockVal = getTotalLockVal(lockData);
            setTotalLockVal(_totalLockVal);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            setTimeLeft(calculateTimeLeft());
            setLockState(getLockState());
            await getLockValue();
        }, 1000);
        // cleanup hook
        return () => {
            clearInterval(interval);
        };
    });

    if (lockState !== LockState.end) {
        return (
            <>
                <PanelWrapper>
                    <div>
                        <Typography variant="h4" component="h3" align="center" className={classes.headerText}>
                            Lockdrop {lockState === LockState.notStart ? 'Starting' : 'Ending'} in:
                        </Typography>
                        <Grid container spacing={2} justify="center">
                            <Grid item>
                                <h2>{timeLeft.days}</h2>
                                <h4>Days</h4>
                            </Grid>
                            <Grid item>
                                <h2>{timeLeft.hours}</h2>
                                <h4>Hours</h4>
                            </Grid>
                            <Grid item>
                                <h2>{timeLeft.minutes}</h2>
                                <h4>Minutes</h4>
                            </Grid>
                            <Grid item>
                                <h2>{timeLeft.seconds}</h2>
                                <h4>Seconds</h4>
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
                    <Typography variant="h2" component="h1" align="center" className={classes.headerText}>
                        Lockdrop has ended
                    </Typography>
                    <Typography variant="h3" component="h4" align="center">
                        Total Locked Value: {totalLockVal} ETH
                    </Typography>
                </PanelWrapper>
            </>
        );
    }
};

export default LockdropCountdownPanel;

const PanelWrapper: React.FC = ({ children }) => {
    const classes = useStyles();

    return (
        <>
            <Container maxWidth="lg" className={classes.container}>
                {children}
            </Container>
        </>
    );
};
