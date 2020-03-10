/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
//import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { LockValue } from '../helpers/lockToDollar';

interface TimeFormat {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface Props {
    startTime: string;
    endTime: string;
}

enum LockState {
    notStart,
    start,
    end,
}

const LockdropPanel: React.FC<Props> = ({ startTime, endTime }) => {
    const calculateTimeLeft = () => {
        const tillStart = +new Date(startTime) - +Date.now();
        const tillEnd = +new Date(endTime) - +Date.now();

        let difference = tillStart;
        // if it has already started
        if (tillStart < 0) {
            difference = tillEnd;
        }

        let timeLeft: TimeFormat = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const getLockState = () => {
        const tillStart = +new Date(startTime) - +Date.now();
        if (tillStart > 0) {
            return LockState.notStart;
        } else if (tillStart <= 0 && !(+new Date(endTime) - +Date.now() < 0)) {
            return LockState.start;
        } else {
            return LockState.end;
        }
    };

    const [timeLeft, setTimeLeft] = useState<TimeFormat>(calculateTimeLeft());
    const [lockState, setLockState] = useState(getLockState());

    // update time value every second
    useEffect(() => {
        setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
            setLockState(getLockState());
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
                                        Lockdrop Starting in:
                                    </Typography>
                                ) : (
                                    <Typography variant="h4" component="h2">
                                        Ending in:
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
                    <Typography variant="h2" align="center">
                        Lockdrop has ended
                    </Typography>
                </PanelWrapper>
            </>
        );
    }
};

export default LockdropPanel;

const PanelWrapper: React.FC = ({ children }) => {
    const useStyles = makeStyles(theme => ({
        container: {
            padding: theme.spacing(4),
            margin: theme.spacing(1),
        },
        lockedVal: {
            margin: theme.spacing(2, 0, 0),
        },
    }));

    const classes = useStyles();

    return (
        <>
            <Container maxWidth="lg" className={classes.container}>
                {children}
                <Typography variant="h5" className={classes.lockedVal}>
                    Total Lock Value is {LockValue} USD
                </Typography>
            </Container>
        </>
    );
};
