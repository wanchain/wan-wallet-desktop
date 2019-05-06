import React, { Component } from 'react';
import './index.less';
import TrezorConnect from 'trezor-connect';
// import Connect from './Connect';
import ConnectHwWallet from 'components/HwWallet/Connect';
import Accounts from 'components/HwWallet/Accounts';
import { observer, inject } from 'mobx-react';

// Initialize TrezorConnect 
TrezorConnect.init({
  // connectSrc: 'file://' + __dirname + '/trezor-connect/', // for trezor-connect hosted locally set endpoint to application files (ignore this field for connect hosted online, connect.trezor.io will be used by default)
  connectSrc: 'https://sisyfos.trezor.io/connect-electron/',
  popup: true, // use trezor-connect UI, set it to "false" to get "trusted" mode and get more UI_EVENTs to render your own UI
  webusb: false, // webusb is not supported in electron
  debug: false, // see whats going on inside iframe
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

@inject(stores => ({
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Trezor extends Component {
  constructor(props) {
    super(props);
    this.dPath = "m/44'/5718350'/0'/0";
    this.chainType = "WAN";
    this.state = {
      visible: false,
      // addresses: [{ key: "0xcf0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", address: "0xcf0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", balance: 0, path: "m/44'/5718350'/0'/0/0" },
      // { key: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", address: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", balance: 0, path: "m/44'/5718350'/0'/0/0" }
      // ],
      addresses: []
    };
  }

  componentWillMount() {
    this.props.changeTitle('Trezor')
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

  instruction = () => {
    return (
      <div>
        <p className="com-gray">Please connect your Trezor wallet directly to your computer</p>
      </div>
    )
  }

  getPublicKey = (callback) => {
    TrezorConnect.getPublicKey({
      path: this.dPath
    }).then((result) => {
      if (result.success) {
        callback(false, result.payload);
      }
    }).catch(error => {
      callback(error, {})
    });
  }

  render() {
    return (
      <div>
        {
          this.state.addresses.length === 0 ? <ConnectHwWallet setAddresses={this.setAddresses} 
          Instruction={this.instruction} getPublicKey={this.getPublicKey} 
          dPath={this.dPath} /> : <Accounts addresses={this.state.addresses} chainType={this.chainType} />
        }
      </div>
    );
  }
}

export default Trezor;




