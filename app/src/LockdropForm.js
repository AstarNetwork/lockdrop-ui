import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react'
import PropTypes from "prop-types";

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

class LockdropForm extends Component {
    constructor(props, context) {
        super(props);

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.contract = context.drizzle.contracts.Lockdrop;
        this.utils = context.drizzle.web3.utils;

        this.state = {
            'form-days': 30,
            'form-value': 1,
        };
    }

    handleSubmit(event) {
        let wei = this.state['form-value'] * 10**18;
        let days = this.state['form-days'];
        this.contract.methods.lock.cacheSend(days, {value: wei});
    }

    handleInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
        console.log(event.target.name);
        console.log(event.target.value);
    }

    render() {
        return (
            <Form>
            <Form.Group controlId='DurationSelect'>
                <Form.Label>How long</Form.Label>
                <InputGroup>
                    <Form.Control as='select' name='form-days' required onChange={this.handleInputChange}>
                        <option>30</option>
                        <option>100</option>
                        <option>300</option>
                        <option>1000</option>
                    </Form.Control>
                    <InputGroup.Append>
                        <InputGroup.Text id='days-addon'>days</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
                <Form.Text className='text-muted'>
                    Your asset will be released after days spended.
                </Form.Text>
            </Form.Group>
            <Form.Group controlId='LockValue'>
                <Form.Label>How much</Form.Label>
                <InputGroup>
                    <Form.Control type='number' name='form-value' placeholder='Locked value' required onChange={this.handleInputChange}/>
                    <InputGroup.Append>
                        <InputGroup.Text id='eth-addon'>ETH</InputGroup.Text>
                    </InputGroup.Append>
                </InputGroup>
                <Form.Text className='text-muted'>
                    ETH will be locked on simple separated contract (<a href='https://ropsten.etherscan.io/address/0xf1cf4d16451b1fcb2fd79e2212d617fb95d24a6e#code'>source code</a>)
                </Form.Text>
            </Form.Group>
            <Button variant='primary' type='button' onClick={this.handleSubmit}>
                Send
            </Button>
        </Form>)
    }
}

LockdropForm.contextTypes = {
    drizzle: PropTypes.object,
};

const mapStateToProps = state => {
    return {
        Lockdrop: state.contracts.Lockdrop,
    };
};

export default drizzleConnect(LockdropForm, mapStateToProps);
