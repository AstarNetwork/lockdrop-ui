import React, { useEffect } from 'react';
import TrezorConnect, { DEVICE } from 'trezor-connect';

function printLog(data: object) {
    console.log(JSON.stringify(data));
}

export default function TrezorLock() {
    useEffect(() => {
        TrezorConnect.on('DEVICE_EVENT', event => {
            if (event.type === DEVICE.CONNECT) {
                console.log('connected to Trezor device');
            } else if (event.type === DEVICE.DISCONNECT) {
                console.log('disconnected to Trezor device');
            }
        });
    }, []);

    const handleButton = () => {
        TrezorConnect.getPublicKey({
            path: "m/49'/0'/0'",
            coin: 'btc',
        }).then(response => {
            printLog(response);
        });
    };

    const signMessage = () => {
        TrezorConnect.signMessage({
            path: "m/44'/0'/0'",
            message: 'example message',
            coin: 'btc',
        }).then(res => {
            printLog(res);
        });
    };

    return (
        <div>
            <p>Hello world</p>
            <button onClick={() => handleButton()}>Get pub key!</button>
            <button onClick={() => signMessage()}>Sign Message!</button>
        </div>
    );
}
