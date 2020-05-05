# Plasm Network Genesis Lockdrop

[![Build Status](https://travis-ci.org/staketechnologies/genesis-lockdrop.svg?branch=master)](https://travis-ci.org/staketechnologies/lockdrop-ui)

## Introduction

This repository contains smart contracts and DApp helper to make participation a bit easy.

Native tokens genesis distribution in Plasm Network carry out according to `Lock` events in Ethereum Lockdrop smart contract.

**Audit**

1. By Quantstamp at 11 Feb 2020: [audit report](https://github.com/staketechnologies/ethereum-lockdrop/blob/16a2d495d85f2d311957b9cf366204fbfabadeaa/audit/quantstamp-audit.pdf)

**Documentation**

- [Introduction](https://medium.com/stake-technologies/plasm-lockdrop-introduction-54614592a13)
- [Participation Guide](https://medium.com/stake-technologies/plasm-lockdrop-howto-c3cd28e6fed1)
- [Testnet Lockdrop](https://docs.plasmnet.io/PlasmTestnet/Lockdrop.html)

## Project Structure

### Root directory

The root of this repo contains the smart contract instance for Ethereum.
This includes truffle, contract abi and Solidity contract source code.
It is meant to be used to deploy contracts to the chain, using truffle and Ganache test chains.
The contract checks are done via travis.
Everything in here is Ethereum-specific and will be seldom used for other lockdrops.

Due to the way how unit tests are started, package installation should be one via `npm`.

### `app` directory

All the front-end components are in this directory.
This will include ETH lockdrop, BTC lockdrop and DOT lockdrop.
Everything that the end-user will interact is in this directory and you can say that this is the actual lockdrop UI.

Package management is done via `yarn`.
