import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createMuiTheme } from '@material-ui/core/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

// define web3 instance as a global variable
declare global {
    interface Window {
        web3: Web3;
        contract: Contract;
    }
}
window.contract = window.contract || {};
window.web3 = window.web3 || {};

const theme = createMuiTheme({
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
