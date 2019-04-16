import React, { Component } from 'react';
import { Button, Card, Modal, Input, message } from 'antd';
import './index.less';
import helper from 'utils/helper';
import { ipcRenderer, clipboard } from 'electron';
import { func } from 'prop-types';
import TrezorConnect from 'trezor-connect';
const { TRANSPORT_EVENT, UI, UI_EVENT, DEVICE_EVENT, DEVICE } = require('trezor-connect');

const { getPhrase } = helper;

// UI.RESPONSE helper (used with "popup: false")
function showUiResponse(data) {
  const response = document.getElementById('response');
  response.style.display = 'block';
  const respInput = document.getElementById('ui-response');
  const respButton = document.getElementById('ui-response-button');
  respInput.value = JSON.stringify(data, null, 2);
  respButton.onclick = () => {
    TrezorConnect.uiResponse(JSON.parse(respInput.value));
    response.style.display = 'none';
  }
}

// Listen to TRANSPORT_EVENT
// This event will be emitted only in "popup: false" mode
TrezorConnect.on(TRANSPORT_EVENT, event => {
  // console.log("TRANSPORT_EVENT", event)
  // console.log(event);
});

// Listen to DEVICE_EVENT
// When "popup: true" is set this event will be emitted only after user grants permission to communicate wit this app
// When "popup: false" it will be emitted without user permissions (user will never be be asked for them)
TrezorConnect.on(DEVICE_EVENT, event => {
  // console.log("DEVICE_EVENT", event)
  // console.log(event);
});

// When "popup: true" this event will be emitted occasionally
// When "popup: false" this event will be emitted for every interaction
TrezorConnect.on(UI_EVENT, event => {
  console.log("UI_EVENT", event)
  console.log(event);

  if (event.type === UI.REQUEST_PIN) {
    // this is an example how to respond to pin request
    showUiResponse({ type: UI.RECEIVE_PIN, payload: '1234' })
  }

  if (event.type === UI.REQUEST_PASSPHRASE) {
    // this is an example how to respond to passphrase request
    showUiResponse({ type: UI.RECEIVE_PASSPHRASE, payload: { value: 'type your passphrase here' } })
  }
});

// Initialize TrezorConnect 
TrezorConnect.init({
  // connectSrc: 'file://' + __dirname + '/trezor-connect/', // for trezor-connect hosted locally set endpoint to application files (ignore this field for connect hosted online, connect.trezor.io will be used by default)
  connectSrc: 'https://sisyfos.trezor.io/connect-electron/',
  popup: true, // use trezor-connect UI, set it to "false" to get "trusted" mode and get more UI_EVENTs to render your own UI
  webusb: false, // webusb is not supported in electron
  debug: true, // see whats going on inside iframe
  lazyLoad: true, // set to "false" if you want to start communication with bridge on application start (and detect connected device right away)
  // or set it to true, then trezor-connect not will be initialized unless you call some TrezorConnect.method() (this is useful when you dont know if you are dealing with Trezor user)
  manifest: {
    email: 'email@developer.com',
    appUrl: 'electron-app-boilerplate'
  }
})
  .then(() => {
    console.log("TrezorConnect is ready! Enjoy")
  })
  .catch(error => {
    console.error('TrezorConnect init error', error)
  });

class Trezor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      showMnemonic: false,
      mnemonic: '',
      pwd: ''
    };
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      showMnemonic: false,
      mnemonic: '',
      pwd: ''
    });
  }

  getAddresses = () => {
    console.log("***********")
    // var TrezorConnect = require('trezor-connect').default;
    // TrezorConnect.manifest({
    //   email: 'guowu@wanchain.org',
    //   appUrl: 'https://github.com/wanchain/wandWallet'
    // })
    // const result = await TrezorConnect.getPublicKey({
    //     path: "m/49'/0'/4'",
    //     coin: "btc"
    //   });
    TrezorConnect.getPublicKey({
      path: "m/49'/0'/0'",
      coin: "btc"
    }).then(function (result) {
      console.log(result);
    }).catch(error => {
      console.error('get public key error', error)
    });
  }


  render() {
    return (
      <div>
        <Card title="Connect a Trezor Wallet" bordered={false}>
          <p>Please connect your Trezor wallet directly to your computer</p>
          <br />
          <Button type="primary" onClick={this.getAddresses}>Continue</Button>
          <Modal
            destroyOnClose={true}
            title="Mnemonic Sentence"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <p>WARNING: DO NOT share this mnemonic sentence with anybody! Otherwise all of your assets will be lost.</p>
            <br />
            {
              this.state.showMnemonic ? (
                <div>
                  <p> Your private mnemonic sentence</p>
                  <Card >
                    <p>{this.state.mnemonic}</p>
                  </Card>
                  <Button type="primary" onClick={() => this.copy2Clipboard(this.state.mnemonic)}>Copy to clipboard</Button>
                </div>
              ) : (
                  <div>
                    <p> Enter password to continue</p>
                    <Input.Password placeholder="Input password" onChange={this.inputChanged} onPressEnter={this.pressEnter} />
                  </div>
                )
            }
          </Modal>
        </Card>
      </div>
    );
  }
}

export default Trezor;




