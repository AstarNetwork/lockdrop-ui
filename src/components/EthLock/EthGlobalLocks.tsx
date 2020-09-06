/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */

import React from 'react';
import { getTotalLockVal } from '../../helpers/lockdrop/EthereumLockdrop';
import { LockEvent } from '../../types/LockdropModels';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { Divider } from '@material-ui/core';
import { defaultAddress } from '../../data/affiliationProgram';
import Web3Utils from 'web3-utils';
import { List as VirtualizedList, ListRowProps, AutoSizer, CellMeasurerCache, CellMeasurer } from 'react-virtualized';

interface LockHistoryProps {
    lockData: LockEvent[];
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        listSection: {
            backgroundColor: 'inherit',
        },
        item: {
            display: 'inline-block',
            //flexDirection: 'row',
            alignItems: 'center',
            height: '100%',
            //flexWrap: 'wrap',
        },
        lockListPage: {
            textAlign: 'center',
            width: '100%',
            height: '100%',
            maxWidth: 'auto',
            backgroundColor: theme.palette.background.paper,
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            minHeight: 450,
        },
        tabMenu: {
            backgroundColor: theme.palette.background.paper,
            width: 'auto',
        },
        autoSizerWrapper: {
            flex: '1 1 auto',
        },
    }),
);

const GlobalLocks: React.FC<LockHistoryProps> = ({ lockData }) => {
    const classes = useStyles();
    const rowCache = new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 150, // tune as estimate for unmeasured rows
        minHeight: 150, // keep this <= any actual row height
        keyMapper: () => 1,
    });

    const RowRenderer: React.FC<ListRowProps> = ({ index, key, style, parent }) => {
        const eventItem = lockData[index];
        return (
            <CellMeasurer cache={rowCache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
                {({ measure, registerChild }) => (
                    <div style={style} className={classes.item} ref={() => registerChild} onLoad={measure}>
                        <ListItem>
                            <ListItemText>
                                <h4>Lock address: {eventItem.lock}</h4>
                                <h5>Locked in block no. {eventItem.blockNo}</h5>
                                <p>
                                    Locked {Web3Utils.fromWei(eventItem.eth, 'ether')} ETH for {eventItem.duration} days
                                </p>
                                {eventItem.introducer !== defaultAddress ? (
                                    <p>Introducer: {eventItem.introducer}</p>
                                ) : (
                                    <p>No introducer</p>
                                )}
                            </ListItemText>
                        </ListItem>
                        <Divider />
                    </div>
                )}
            </CellMeasurer>
        );
    };

    return (
        <div className={classes.lockListPage}>
            {lockData.length > 0 ? (
                <>
                    <div>
                        <h1>Global Locks</h1>
                        <h3>{getTotalLockVal(lockData, 4)} ETH locked</h3>
                        <p>There are {lockData.length} locks</p>
                    </div>

                    <div className={classes.autoSizerWrapper}>
                        <AutoSizer>
                            {({ width, height }) => (
                                <VirtualizedList
                                    height={height}
                                    rowCount={lockData.length}
                                    rowHeight={rowCache.rowHeight}
                                    rowRenderer={RowRenderer}
                                    width={width}
                                    overscanRowCount={3}
                                    deferredMeasurementCache={rowCache}
                                />
                            )}
                        </AutoSizer>
                    </div>
                </>
            ) : (
                <>
                    <h1>No Locks</h1>
                    <h4>Please lock some ETH!</h4>
                </>
            )}
        </div>
    );
};

export default GlobalLocks;
