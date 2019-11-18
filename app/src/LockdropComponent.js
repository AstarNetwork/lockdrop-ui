import React from "react";
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  ContractData,
  ContractForm,
} from "drizzle-react-components";
import Container from "react-bootstrap/Container";

import logo from "./logo.png";

export default () => (
  <Container className="p-3">
    <ToastContainer />
    <div>
      <img src={logo} id="logo" alt="plasm-logo" />
      <h1>Plasm Ethereum Lockdrop</h1>
      <p>TODO: short instruction how to use</p>
    </div>

    <div className="section">
      <h2>Lockdrop Contract</h2>
      <p>
        <strong>Stored Value: </strong>
        <ContractData contract="Lockdrop" method="LOCK_START_TIME" />
      </p>
      <ContractForm contract="Lockdrop" method="lock"/>
    </div>
  </Container>
);
