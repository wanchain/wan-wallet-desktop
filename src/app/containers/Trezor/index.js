import intl from 'react-intl-universal';
import React, { Component } from 'react';
import TrezorConnect from 'trezor-connect';
import { observer, inject } from 'mobx-react';
import { Icon, message } from 'antd';

const wanTx = require('wanchainjs-tx');

import './index.less';
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const WALLET_ID = 0x03;
const TREZOR = 'trezor';
const CHAIN_TYPE = 'WAN';
const WAN_PATH = "m/44'/5718350'/0'/0";

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
    email: 'techsupport@wanchain.com',
    appUrl: 'wan-wallet-desktop'
  },
  env: "electron"
})
.then(() => {
  console.log("TrezorConnect is ready")
})
.catch(error => {
    console.error('TrezorConnect init error', error)
  });

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  addTrezorAddr: newAddr => stores.wanAddress.addAddresses(TREZOR, newAddr)
}))

@observer
class Trezor extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Trezor.trezor')
  }

  componentDidUpdate() {
    if (this.props.trezorAddrList.length !== 0 && !this.timer) {
      this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  handleClick = () => {
    wand.shell.openExternal('https://wallet.trezor.io/#/bridge');
  }

  instruction = () => {
    return (
      <div>
        <p className="com-gray">1. {intl.get('Trezor.installBridge')} <Icon type='link' onClick={this.handleClick}/></p>
        <p className="com-gray">2. {intl.get('Trezor.connectTrezorWalletToComputer')}</p>
      </div>
    )
  }

  getPublicKey = (callback) => {
    TrezorConnect.getPublicKey({
      path: WAN_PATH
    }).then((result) => {
      if (result.success) {
        callback(false, result.payload);
      }
    }).catch(error => {
      callback(error, {})
    });
  }

  signTransaction = (path, tx, callback) => {
    TrezorConnect.ethereumSignTransaction({
      path: path,
      transaction: {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        chainId: tx.chainId,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        txType: tx.Txtype,
      },
    }).then((result) => {
      if (!result.success) {
        message.warn(intl.get('Trezor.signTransactionFailed'));
        callback(intl.get('Trezor.signFailed'), null);
        return;
      }

      tx.v = result.payload.v;
      tx.r = result.payload.r;
      tx.s = result.payload.s;
      let eTx = new wanTx(tx);
      let signedTx = '0x' + eTx.serialize().toString('hex');
      console.log('Signed tx: ', signedTx);
      callback(null, signedTx);
    });
  }

  setAddresses = newAddr => {
    wand.request('account_getAll', { chainID: 5718350 }, (err, ret) => {
      if(err) return;
      let hdInfoFromDb = [];
      Object.values(ret.accounts).forEach(item => {
        if(item[WALLET_ID]) {
          hdInfoFromDb.push(item[WALLET_ID]);
        }
      })
      newAddr.forEach(item => {
        let matchValue = hdInfoFromDb.find(val => val.addr === item.address.toLowerCase())
        if(matchValue) {
          item.name = matchValue.name;
        }
      });
      this.props.addTrezorAddr(newAddr)
    })
  }

  render() {
    const { trezorAddrList } = this.props;
    return (
      <div>
        {
          trezorAddrList.length === 0
            ? <ConnectHwWallet setAddresses={this.setAddresses} Instruction={this.instruction} getPublicKey={this.getPublicKey} dPath={WAN_PATH} />
            : <Accounts name={['trezor']} addresses={trezorAddrList} signTransaction={this.signTransaction} chainType={CHAIN_TYPE} />
        }
      </div>
    );
  }
}

export default Trezor;




