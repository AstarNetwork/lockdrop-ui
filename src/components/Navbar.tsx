// TODOD check app complaining about unused React import
/* eslint-disable */
// @ts-ignore
import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { IonHeader, IonButtons, IonMenuButton, IonToolbar, IonTitle } from '@ionic/react';
import plasmLogo from '../resources/plasm-logo.png';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        grow: {
            flexGrow: 1,
        },
        navbar: {
            backgroundColor: 'black',
        },
        logoIcon: {
            margin: theme.spacing(1),
            maxHeight: 45,
            height: '100%',
            verticalAlign: 'middle',
        },
        title: {
            color: 'white',
        },
        inputRoot: {
            color: 'inherit',
        },
        sectionDesktop: {
            display: 'none',
            [theme.breakpoints.up('md')]: {
                display: 'flex',
            },
        },
        sectionMobile: {
            display: 'flex',
            [theme.breakpoints.up('md')]: {
                display: 'none',
            },
        },
        listItem: {
            width: '100%',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            fontWeight: theme.typography.fontWeightRegular,
        },
    }),
);

export default function Navbar(): JSX.Element {
    const classes = useStyles();

    return (
        <>
            <IonHeader className={classes.navbar}>
                <IonToolbar color="black">
                    <IonButtons slot="start">
                        <IonMenuButton className={classes.title} />
                        <img className={classes.logoIcon} src={plasmLogo} alt="" />
                    </IonButtons>
                    <IonTitle className={classes.title}>Plasm Network</IonTitle>
                </IonToolbar>
            </IonHeader>
        </>
    );
}
