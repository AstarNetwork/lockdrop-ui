import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Link from '@material-ui/core/Link';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Grid from '@material-ui/core/Grid';
import { Company, Products, Collaboration, Blogs, Community } from '../data/links';
import Divider from '@material-ui/core/Divider';
import { ThemeColors } from '../theme/themes';

function Copyright() {
    return (
        <Typography variant="body2">
            {'© 2019-' + new Date().getFullYear() + ' '}
            <Link color="inherit" href="https://stake.co.jp/">
                Stake Technologies, Inc.
            </Link>{' '}
            {'All Rights Reserved.'}
        </Typography>
    );
}

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    socialIcon: {
        color: 'white',
        fontSize: 60,
        paddingLeft: theme.spacing(1),
    },
    footer: {
        padding: theme.spacing(2),
        marginTop: 'auto',
        backgroundColor: 'white',
        textAlign: 'center',
        color: 'black',
    },
    footerHeader: {
        color: ThemeColors.darkBlue,
    },
}));

export default function StickyFooter() {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <CssBaseline />
            <footer className={classes.footer}>
                <Container maxWidth="md">
                    <Grid container spacing={4}>
                        <Grid item>
                            <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                                Company
                            </Typography>
                            <Divider />

                            <List component="nav">
                                {Company.map(company => (
                                    <Link color="inherit" href={company.link} key={company.description}>
                                        <ListItem button>
                                            <ListItemText primary={company.description} />
                                        </ListItem>
                                    </Link>
                                ))}
                            </List>
                        </Grid>
                        <Grid item>
                            <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                                Repositories
                            </Typography>
                            <Divider />
                            <List component="nav">
                                {Products.map(product => (
                                    <Link color="inherit" href={product.link} key={product.description}>
                                        <ListItem button>
                                            <ListItemText primary={product.description} />
                                        </ListItem>
                                    </Link>
                                ))}
                            </List>
                        </Grid>
                        <Grid item>
                            <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                                Collaboration
                            </Typography>
                            <Divider />
                            <List component="nav">
                                {Collaboration.map(collaboration => (
                                    <Link color="inherit" href={collaboration.link} key={collaboration.description}>
                                        <ListItem button>
                                            <ListItemText primary={collaboration.description} />
                                        </ListItem>
                                    </Link>
                                ))}
                            </List>
                        </Grid>
                        <Grid item>
                            <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                                Blog
                            </Typography>
                            <Divider />
                            <List component="nav">
                                {Blogs.map(blog => (
                                    <Link color="inherit" href={blog.link} key={blog.description}>
                                        <ListItem button>
                                            <ListItemText primary={blog.description} />
                                        </ListItem>
                                    </Link>
                                ))}
                            </List>
                        </Grid>
                        <Grid item>
                            <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                                Community
                            </Typography>
                            <Divider />
                            <List component="nav">
                                {Community.map(community => (
                                    <Link color="inherit" href={community.link} key={community.description}>
                                        <ListItem button>
                                            <ListItemText primary={community.description} />
                                        </ListItem>
                                    </Link>
                                ))}
                            </List>
                        </Grid>
                    </Grid>
                </Container>

                <Container maxWidth="sm">
                    <Typography variant="body1" component="h1" align="center" className={classes.footerHeader}>
                        <Copyright />
                    </Typography>
                </Container>
            </footer>
        </div>
    );
}
