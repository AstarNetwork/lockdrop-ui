import React, { Component, useState } from 'react';
import { drizzleConnect } from 'drizzle-react'
import PropTypes from "prop-types";

import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

class LockList extends Component {
    constructor(props, context) {
        super(props);

        this.web3 = context.drizzle.web3;
        this.contract = context.drizzle.contracts.Lockdrop;
        const accounts = props.accounts;

        this.getPastEvents({fromBlock: 6958002}).then(events => events.map(e => this.web3.eth.getTransaction(e.transactionHash).then(console.log)));
        this.getPastEvents({fromBlock: 6958002})
            .then(events => Promise.all(
                events.map(e => Promise.all(
                    [Promise.resolve(e.returnValues), this.web3.eth.getTransaction(e.transactionHash)]
                ))
            ))
            .then(events => this.setState({locks:
                events.filter(e => e[1]['from'] == accounts[0]).map(e => e[0])
            }));
        this.state = {locks: []};
    }

    getPastEvents(options: any) {
        const yourContractWeb3 = new this.web3.eth.Contract(this.contract.abi, this.contract.address);
        return yourContractWeb3.getPastEvents('Locked', options);
    }

    render() {
        return (
            <Table striped bordered hover>
            <thead>
                <tr>
                  <th>#</th>
                  <th>Amount, ETH</th>
                  <th>Duration, days</th>
                  <th>Lock Contract</th>
                </tr>
              </thead>
              <tbody>
              {this.state.locks.map((a, i) => {
                  const link = "https://ropsten.etherscan.io/address/" + a.lock; 
                  return (<tr>
                    <td>{i}</td>
                    <td>{this.web3.utils.fromWei(a.eth, 'ether')}</td>
                    <td>{a.duration}</td>
                    <td><a href={link}>{a.lock}</a></td>
                  </tr>)
                })}
              </tbody>
            </Table>
        )
    }
}

LockList.contextTypes = {
    drizzle: PropTypes.object,
    accounts: PropTypes.arrayOf(PropTypes.string),
    accountIndex: PropTypes.number.isRequired,
};

const mapStateToProps = state => {
    return {
        Lockdrop: state.contracts.Lockdrop,
        accounts: state.accounts,
    };
};

export default drizzleConnect(LockList, mapStateToProps);
