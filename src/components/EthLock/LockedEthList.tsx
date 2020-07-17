/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React from 'react';
//import * as ethAddress from 'ethereum-address';
import Web3 from 'web3';
import SectionCard from '../SectionCard';
import { LockEvent } from '../../types/LockdropModels';
import { createStyles, Theme, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';
import CurrentLocks from './CurrentLocks';
import GlobalLocks from './EthGlobalLocks';

interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: any;
    value: any;
}

interface LockHistoryProps {
    web3: Web3;
    accounts: string[]; // this will be used to get locks for a certain account
    lockData: LockEvent[];
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </Typography>
    );
}

function a11yProps(index: any) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tabMenu: {
            backgroundColor: theme.palette.background.paper,
            width: 'auto',
        },
    }),
);

// component that displays the number of tokens and the duration for the lock via Web3
const LockedEthList: React.FC<LockHistoryProps> = ({ web3, accounts, lockData }) => {
    const classes = useStyles();
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };

    return (
        <>
            <SectionCard maxWidth="lg">
                <div className={classes.tabMenu}>
                    <AppBar position="static" color="inherit">
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="fullWidth"
                            aria-label="full width tabs"
                        >
                            <Tab label="Locked Tokens" {...a11yProps(0)} />
                            <Tab label="Unlock Tokens" {...a11yProps(1)} />
                        </Tabs>
                    </AppBar>
                    <SwipeableViews
                        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                        index={value}
                        onChangeIndex={handleChangeIndex}
                    >
                        <TabPanel value={value} index={0} dir={theme.direction}>
                            <GlobalLocks lockData={lockData} />
                        </TabPanel>
                        <TabPanel value={value} index={1} dir={theme.direction}>
                            <CurrentLocks web3={web3} accounts={accounts} lockData={lockData} />
                        </TabPanel>
                    </SwipeableViews>
                </div>
            </SectionCard>
        </>
    );
};

export default LockedEthList;
