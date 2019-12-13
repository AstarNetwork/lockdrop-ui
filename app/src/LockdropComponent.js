import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import logo from './logo.png';

import LockdropForm from './LockdropForm';
import LockList from './LockList';

export default (props) => (
    <Container>
        <ToastContainer />
        <Image src={logo} width="50%"  />
        <Tabs defaultActiveKey="send" id="lockdrop-tabs">
            <Tab eventKey="send" title="Send">
                <LockdropForm />
            </Tab>
            <Tab eventKey="locks" title="My locks">
                <LockList />
            </Tab>
        </Tabs>
    </Container>
)
