import React, { Component } from 'react';
import { Button, Card, Modal, Input, Checkbox, Table } from 'antd';
import './index.less';
import TrezorConnect from 'trezor-connect';
const { TRANSPORT_EVENT, UI, UI_EVENT, DEVICE_EVENT, DEVICE } = require('trezor-connect');
import Connect from './Connect';
import Accounts from './Accounts';
const CheckboxGroup = Checkbox.Group;

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
      addresses: [],
    };
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
      addresses: [],
    });
  }

  setAddresses = (addresses) => {
    this.setState({ addresses: addresses });
  }

  render() {
    return (
      <div>
        {
          this.state.addresses.length === 0 ? <Connect setAddresses={this.setAddresses} /> : <Accounts addresses={this.state.addresses} />
        }
      </div>
    );
  }
}

export default Trezor;




