import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import clsx from 'clsx';
import React from 'react';
import { Icon } from 'semantic-ui-react';
import styled from 'styled-components';
import { Community, Links, Whitepaper } from '../../data/links';
import plasmLogo from '../../resources/plasm-logo.png';
import { customMedia } from '../../theme/globalStyle';
import { theme } from '../../theme/themes';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: 'flex',
        },
        appBar: {
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
        },
        appBarShift: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
            transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        menuButton: {
            marginRight: theme.spacing(2),
        },
        hide: {
            display: 'none',
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: drawerWidth,
        },
        drawerHeader: {
            display: 'flex',
            alignItems: 'center',
            padding: theme.spacing(0, 1),
            ...theme.mixins.toolbar,
            justifyContent: 'flex-end',
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: -drawerWidth,
        },
        contentShift: {
            transition: theme.transitions.create('margin', {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
        },
    }),
);

const HeaderSmall: React.FC = () => {
    const classes = useStyles();
    // const theme = useTheme();
    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    return (
        <HeaderSmallContainer style={{ zIndex: 100 }}>
            <div className={classes.root}>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    edge="start"
                    className={clsx(classes.menuButton, open && classes.hide)}
                >
                    <MenuIcon />
                </IconButton>
                <Drawer
                    className={classes.drawer}
                    variant="persistent"
                    anchor="left"
                    open={open}
                    classes={{
                        paper: classes.drawerPaper,
                    }}
                >
                    <div className={classes.drawerHeader}>
                        <div className="logo">
                            <img src={plasmLogo} alt="plasm-logo" className="plasm-logo" />
                            <h4>Plasm Network</h4>
                        </div>
                        <IconButton onClick={handleDrawerClose}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <List>
                        <TitleP>Whitepaper</TitleP>
                        {Whitepaper.map(whitepaper => (
                            <a
                                href={whitepaper.link}
                                rel="noopener noreferrer"
                                target="_blank"
                                key={whitepaper.description}
                            >
                                <ListItem button>
                                    {/*
                  // @ts-ignore */}
                                    <Icon name={whitepaper.icon} color="grey" size="large" />
                                    <SmallMenuP>{whitepaper.description}</SmallMenuP>
                                </ListItem>
                            </a>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <TitleP>Community</TitleP>
                        {Community.map(community => (
                            <a
                                href={community.link}
                                rel="noopener noreferrer"
                                target="_blank"
                                key={community.description}
                            >
                                <ListItem button>
                                    {/*
                  // @ts-ignore */}
                                    <Icon name={community.icon} color="grey" size="large" />
                                    <SmallMenuP>{community.description}</SmallMenuP>
                                </ListItem>
                            </a>
                        ))}
                    </List>
                    <Divider style={{ marginBottom: '10px' }} />
                    <div>
                        <a href={Links.docs} rel="noopener noreferrer" target="_blank">
                            <ListItem button>
                                <Icon name="book" color="grey" size="large" />
                                <SmallMenuP>Docs</SmallMenuP>
                            </ListItem>
                        </a>
                    </div>

                    <div>
                        <a href={Links.twitter} rel="noopener noreferrer" target="_blank">
                            <ListItem button>
                                <Icon name="twitter" color="grey" size="large" />
                                <SmallMenuP>Twitter</SmallMenuP>
                            </ListItem>
                        </a>
                    </div>

                    <div>
                        <a href={Links.github} rel="noopener noreferrer" target="_blank">
                            <ListItem button>
                                <Icon name="github" color="grey" size="large" />
                                <SmallMenuP>GitHub</SmallMenuP>
                            </ListItem>
                        </a>
                    </div>
                </Drawer>
            </div>
        </HeaderSmallContainer>
    );
};

export default HeaderSmall;

const HeaderSmallContainer = styled.div`
    ${customMedia.greaterThan('tabletPro')`
    display: none;
  `}

    position: fixed;
    .MuiToolbar-gutters {
        background: ${theme.colors.creamWhite};
    }

    .MuiIconButton-label {
        color: ${theme.colors.lightGrey} !important;
        margin-left: 20px;
    }
    .MuiSvgIcon-root {
        width: 30px;
        height: 30px;
    }

    .logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        color: black;
        opacity: 0.9;
        .plasm-logo {
            height: 38px;
            margin-right: 10px;
        }
        h4 {
            font-size: 18px;
            margin-top: 0px;
        }
    }
`;
const SmallMenuP = styled.p`
    font-size: 16px;
    margin-left: 18px;
    margin-bottom: 0px;
    color: ${theme.colors.black};
`;
const TitleP = styled.p`
    font-size: 18px;
    margin-bottom: 6px !important;
    margin-bottom: 0px;
    color: ${theme.colors.black};
    text-align: center;
`;
