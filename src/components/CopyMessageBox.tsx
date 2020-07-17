/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState } from 'react';
import { Paper, Typography, makeStyles, createStyles, Tooltip, IconButton } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { IonToast } from '@ionic/react';

interface Props {
    header: string;
    message: string;
}

const useStyles = makeStyles(theme =>
    createStyles({
        messageBox: {
            padding: theme.spacing(2, 4),
            alignItems: 'center',
        },
        signMessage: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            height: '100%',
        },
        message: {
            wordBreak: 'break-all',
        },
        copyIcon: {
            verticalAlign: 'middle',
        },
    }),
);

const CopyMessageBox: React.FC<Props> = ({ header, message }) => {
    const classes = useStyles();
    const [showCopyToast, setCopyToast] = useState(false);

    const clickCopyMessage = () => {
        navigator.clipboard.writeText(message).then(
            function() {
                setCopyToast(true);
            },
            function(err) {
                console.error('Async: Could not copy text: ', err);
            },
        );
    };
    return (
        <>
            <Paper elevation={1} className={classes.messageBox}>
                <Typography component="h4" variant="h3">
                    {header}:
                </Typography>
                <div className={classes.signMessage}>
                    <Typography component="h1" variant="h2" className={classes.message}>
                        {message}
                    </Typography>
                    <div className={classes.copyIcon}>
                        <Tooltip title="Copy Message" aria-label="copy">
                            <IconButton color="inherit" component="span" onClick={() => clickCopyMessage()}>
                                <FileCopyIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                </div>
            </Paper>
            <IonToast
                isOpen={showCopyToast}
                onDidDismiss={() => setCopyToast(false)}
                message="Copied message to clipboard"
                duration={2000}
            />
        </>
    );
};

export default CopyMessageBox;
