import React, { useEffect, useState } from 'react';

function CountdownTimer({ deadline }) {
    const calculateTimeLeft = date => {
        const difference = +new Date(date) - +new Date();
        let timeLeft = {};

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

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(deadline));

    useEffect(() => {
        setTimeout(() => {
            setTimeLeft(calculateTimeLeft(deadline));
        }, 1000);
    });

    const timerComponents = [];

    Object.keys(timeLeft).forEach(interval => {
        if (!timeLeft[interval]) {
            return;
        }

        timerComponents.push(
            <span>
                {timeLeft[interval]} {interval}{' '}
            </span>,
        );
    });

    return (
        <>
            <div className="countdown">{timerComponents.length ? timerComponents : <span>Time's up!</span>}</div>
        </>
    );
}

export default CountdownTimer;
