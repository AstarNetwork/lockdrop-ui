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
    <img class="img-fluid" src={logo} alt="plasm-logo" />
    Lock 1 ETH for <ContractForm contract="Lockdrop" method="lock" sendArgs={{value: 10**18}}/>
  </Container>
);
