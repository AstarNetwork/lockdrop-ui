/* eslint-disable react/prop-types */
import React, { useMemo, useCallback } from 'react';
import { TimeFormat } from '../types/LockdropModels';
import moment, { Moment, duration } from 'moment';

interface Props {
    startTime: Moment;
    endTime: Moment;
    /**function callback if the countdown is over. This returns a boolean as the parameter */
    onFinish?: Function;
}

const CountdownTimer: React.FC<Props> = ({ startTime, endTime, onFinish }) => {
    const now = moment().utc();
    const handleCountdownFinish = useCallback(
        (didFinish: boolean) => {
            if (onFinish) onFinish(didFinish);
        },
        [onFinish],
    );

    const timeLeft = useMemo(() => {
        const tillStart = moment(startTime).valueOf() - now.valueOf();

        //let difference = tillStart;
        let difference = duration(startTime.diff(now));

        // if the lockdrop has already started
        if (tillStart < 0) {
            difference = duration(endTime.diff(now));
        }

        let _timeLeft: TimeFormat = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        const tillEnd = moment(endTime).valueOf() - now.valueOf();
        // check if the duration has ended
        if (tillEnd > 0) {
            _timeLeft = {
                days: difference.days(),
                hours: difference.hours(),
                minutes: difference.minutes(),
                seconds: difference.seconds(),
            };
        }
        handleCountdownFinish(tillEnd < 0);
        return _timeLeft;
    }, [now, startTime, endTime, handleCountdownFinish]);

    return (
        <>
            <p>
                {timeLeft.days} Days {timeLeft.hours} Hours {timeLeft.minutes} Minutes {timeLeft.seconds} Seconds
            </p>
        </>
    );
};

export default CountdownTimer;
