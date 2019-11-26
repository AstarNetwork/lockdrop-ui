import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import logo from './logo.png';

import LockdropForm from './LockdropForm';

export default (props) => (
    <Container>
        <ToastContainer />
        <Image src={logo} fluid />
        <LockdropForm />
    </Container>
)
