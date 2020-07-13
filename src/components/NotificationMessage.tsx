/* eslint-disable react/prop-types */
import React from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
    btnPrimary: {
        background: 'linear-gradient(45deg, #1d417f 30%, #2e8ec0 90%)',
        border: 0,
        borderRadius: 3,
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .3)',
        color: 'white',
        height: 48,
        padding: '0 30px',
    },
    messageBox: {
        display: 'flex',
    },

    messageText: {
        color: 'white',
    },
}));

interface Props {
    message: string;
    gotoUrl?: string;
    btnName: string;
}

const NotificationMessage: React.FC<Props> = ({ message, gotoUrl, btnName }) => {
    const classes = useStyles();

    return (
        <div className={classes.messageBox}>
            <Typography component="p" align="center" className={classes.messageText}>
                {message}
            </Typography>
            <span />
            {gotoUrl ? (
                <a href={gotoUrl}>
                    <Button color="primary" size="small">
                        {btnName}
                    </Button>
                </a>
            ) : null}
        </div>
    );
};

export default NotificationMessage;
