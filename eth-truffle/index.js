#!/usr/bin/env node

const Web3 = require('web3');
const lib = require('./lib/lockdrop');

require('yargs')
    .option('provider', {
        alias: 'p',
        description: 'Etheruem JSON-RPC provider',
        default: 'http://127.0.0.1:8545',
        type: 'string',
    })
    .command(
        'generate',
        'Generate genesis config from contract state',
        yargs =>
            yargs
                .option('contract', {
                    alias: 'c',
                    description: 'Lockdrop contract address',
                    type: 'string',
                })
                .option('from', {
                    alias: 'f',
                    description: 'Start block number',
                    type: 'number',
                })
                .option('to', {
                    alias: 't',
                    description: 'Finish block number',
                    type: 'number',
                })
                .demandOption(['contract', 'from'], 'Please provide contract address and lockdrop start block number'),
        argv => {
            const web3 = new Web3(argv.provider);

            // Get locks events from contract
            lib.getLocks(
                argv.contract,
                argv.from,
                argv.to ? argv.to : 'latest',
            )(web3)
                .then(locks => {
                    let rates = lib.getIssueRates(locks);
                    let balances = lib.getBalances(rates);
                    console.log(
                        '"balances": ' + balances.reduce((s, i) => s + '(hex!["' + i[0] + '"], ' + i[1] + '),\n'),
                    );
                    console.log('total: ' + balances.reduce((s, i) => s + parseInt(i[1]), 0) / 10 ** 15);
                })
                .catch(console.log);
        },
    )
    .help()
    .alias('help', 'h').argv;
