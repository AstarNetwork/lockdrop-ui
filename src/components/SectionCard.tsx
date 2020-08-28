/* eslint-disable react/prop-types */
import React from 'react';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { ThemeColors } from '../theme/themes';

interface Props {
    maxWidth: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
}

const SectionCard: React.FC<Props> = ({ maxWidth, children }) => {
    const useStyles = makeStyles(theme => ({
        paper: {
            backgroundColor: ThemeColors.white,
            padding: theme.spacing(0, 0, 2),
            margin: theme.spacing(1),
        },
    }));

    const classes = useStyles();

    return (
        <>
            <Container maxWidth={maxWidth}>
                <Paper elevation={5} className={classes.paper}>
                    {children}
                </Paper>
            </Container>
        </>
    );
};

export default SectionCard;
