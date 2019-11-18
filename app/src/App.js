import React, { Component } from "react";
import { DrizzleProvider } from "drizzle-react";
import { LoadingContainer } from "drizzle-react-components";

import "./App.css";

import drizzleOptions from "./drizzleOptions";
import LockdropContainer from "./LockdropContainer";
import store from './middleware'

class App extends Component {
  render() {
    return (
      <DrizzleProvider store={store} options={drizzleOptions}>
        <LoadingContainer>
          <LockdropContainer />
        </LoadingContainer>
      </DrizzleProvider>
    );
  }
}

export default App;
