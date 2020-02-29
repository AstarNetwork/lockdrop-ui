import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Badge from '@material-ui/core/Badge';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import MoreIcon from '@material-ui/icons/MoreVert';
import { Button } from '@material-ui/core';
import TwitterIcon from '@material-ui/icons/Twitter';
import GitHubIcon from '@material-ui/icons/GitHub';
import plasmLogo from '../resources/plasm-logo.png';
import DescriptionIcon from '@material-ui/icons/Description';
import NoteIcon from '@material-ui/icons/Note';
import ForumIcon from '@material-ui/icons/Forum';
import AnnouncementIcon from '@material-ui/icons/Announcement';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        grow: {
            flexGrow: 1,
        },
        navbar: {
            backgroundColor: 'black',
        },
        logoIcon: {
            marginRight: theme.spacing(2),
            maxHeight: 46,
        },
        title: {
            display: 'none',
            [theme.breakpoints.up('sm')]: {
                display: 'block',
            },
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
    }),
);

export default function Navbar() {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        handleMobileMenuClose();
    };

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const wpMenuId = 'primary-see-whitepaper-menu';
    //const communityMenuId = 'primary-see-community-menu';
    const renderMenu = (
        <>
            <Menu
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                id={wpMenuId}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={isMenuOpen}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleMenuClose}>English</MenuItem>
                <MenuItem onClick={handleMenuClose}>Japanese</MenuItem>
            </Menu>

            {/* <Menu
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                id={communityMenuId}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={isMenuOpen}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleMenuClose}>Discord</MenuItem>
                <MenuItem onClick={handleMenuClose}>Telegram</MenuItem>
            </Menu> */}
        </>
    );

    const mobileMenuId = 'primary-see-whitepaper-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton
                    aria-label="account of current user"
                    aria-controls="primary-see-whitepaper-menu"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <Badge badgeContent={4} color="secondary">
                        <NoteIcon />
                    </Badge>
                </IconButton>
                <p>Whitepaper</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton
                    aria-label="account of current user"
                    aria-controls="primary-see-community-menu"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <Badge badgeContent={11} color="secondary">
                        <DescriptionIcon />
                    </Badge>
                </IconButton>
                <p>Docs</p>
            </MenuItem>
            <MenuItem>
                <IconButton aria-label="show 11 new github" color="inherit">
                    <Badge badgeContent={11} color="secondary">
                        <ForumIcon />
                    </Badge>
                </IconButton>
                <p>Community</p>
            </MenuItem>
            <MenuItem>
                <IconButton aria-label="show 11 new github" color="inherit">
                    <Badge badgeContent={11} color="secondary">
                        <AnnouncementIcon />
                    </Badge>
                </IconButton>
                <p>Blog</p>
            </MenuItem>
        </Menu>
    );

    return (
        <div className={classes.grow}>
            <AppBar position="static" className={classes.navbar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="open drawer">
                        <img className={classes.logoIcon} src={plasmLogo} />
                    </IconButton>
                    <Typography className={classes.title} variant="h6" noWrap>
                        Plasm Network
                    </Typography>
                    <div className={classes.grow} />
                    <div className={classes.sectionDesktop}>
                        <Button color="inherit" onClick={handleProfileMenuOpen}>
                            Whitepaper
                        </Button>
                        <Button color="inherit">Docs</Button>
                        <Button color="inherit" onClick={handleProfileMenuOpen}>
                            Community
                        </Button>
                        <Button color="inherit">Blog</Button>
                        <IconButton aria-label="show twitter" color="inherit">
                            <TwitterIcon />
                        </IconButton>
                        <IconButton
                            edge="end"
                            aria-label="account of current user"
                            aria-controls={wpMenuId}
                            aria-haspopup="true"
                            color="inherit"
                        >
                            <GitHubIcon />
                        </IconButton>
                    </div>
                    <div className={classes.sectionMobile}>
                        <IconButton
                            aria-label="show more"
                            aria-controls={mobileMenuId}
                            aria-haspopup="true"
                            onClick={handleMobileMenuOpen}
                            color="inherit"
                        >
                            <MoreIcon />
                        </IconButton>
                    </div>
                </Toolbar>
            </AppBar>
            {renderMobileMenu}
            {renderMenu}
        </div>
    );
}
