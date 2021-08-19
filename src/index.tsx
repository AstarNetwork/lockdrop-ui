// TODOD check app complaining about unused React import
/* eslint-disable */
// @ts-ignore
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'react-virtualized/styles.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { MuiThemeProvider, createTheme, responsiveFontSizes } from '@material-ui/core/styles';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { toast } from 'react-toastify';

// define web3 instance as a global variable
declare global {
    interface Window {
        web3: Web3;
        contract: Contract;
    }
}
toast.configure({
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
});

window.contract = window.contract || {};
window.web3 = window.web3 || {};

let theme = createTheme({
    typography: {
        fontFamily: [
            'Work Sans',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Oxygen',
            'Ubuntu',
            'Cantarell',
            'Fira Sans',
            'Droid Sans',
            'Helvetica Neue',
        ].join(','),
    },
    palette: {
        primary: {
            main: '#4791db',
            light: '#1976d2',
            dark: '#115293',
        },
    },
});

theme = responsiveFontSizes(theme);

ReactDOM.render(
    <MuiThemeProvider theme={theme}>
        <App />
    </MuiThemeProvider>,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
