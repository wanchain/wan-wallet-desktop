import intl from 'react-intl-universal';
import React, { Component } from 'react';
import TrezorConnect, { DEVICE_EVENT, DEVICE } from 'trezor-connect';
import { observer, inject } from 'mobx-react';
import { Icon } from 'antd';
import { signTransaction, getPublicKey } from 'componentUtils/trezor'
import style from './index.less';
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const WALLET_ID = 0x03;
const TREZOR = 'trezor';
const CHAIN_TYPE = 'WAN';
const WAN_PATH = "m/44'/5718350'/0'/0";
const ETH_PATH = "m/44'/60'/0'/0";

// Initialize TrezorConnect
TrezorConnect.init({
  // connectSrc: 'file://' + __dirname + '/trezor-connect/', // for trezor-connect hosted locally set endpoint to application files (ignore this field for connect hosted online, connect.trezor.io will be used by default)
  // connectSrc: 'https://sisyfos.trezor.io/connect-electron/',
  connectSrc: 'https://connect.trezor.io/8/',
  popup: true, // use trezor-connect UI, set it to "false" to get "trusted" mode and get more UI_EVENTs to render your own UI
  webusb: false, // webusb is not supported in electron
  debug: false, // see whats going on inside iframe
  lazyLoad: true, // set to "false" if you want to start communication with bridge on application start (and detect connected device right away)
  // or set it to true, then trezor-connect not will be initialized unless you call some TrezorConnect.method() (this is useful when you dont know if you are dealing with Trezor user)
  manifest: {
    email: 'techsupport@wanchain.com',
    appUrl: 'wan-wallet-desktop'
  },
  env: 'electron'
})
  .then(() => {
    console.log('TrezorConnect is ready')
  })
  .catch(error => {
    console.error('TrezorConnect init error', error)
  });

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  trezorWANAddrList: stores.wanAddress.trezorAddrList,
  trezorETHAddrList: stores.ethAddress.trezorAddrList,
  updateWANAddress: type => stores.wanAddress.updateAddress(type),
  updateETHAddress: type => stores.ethAddress.updateAddress(type),
  updateWANTransHistory: () => stores.wanAddress.updateTransHistory(),
  updateETHTransHistory: () => stores.ethAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  addWANTrezorAddr: newAddr => stores.wanAddress.addAddresses(TREZOR, newAddr),
  addETHTrezorAddr: newAddr => stores.ethAddress.addAddresses(TREZOR, newAddr),
  setCurrTokenChain: chain => stores.tokens.setCurrTokenChain(chain),
}))

@observer
class Trezor extends Component {
  constructor(props) {
    super(props);
    this.chain = props.match.params.chain || CHAIN_TYPE;
    this.isWAN = this.chain === CHAIN_TYPE;
    this.props.changeTitle('Trezor.trezor');
    this.props.setCurrTokenChain(this.chain);

    // Declare trezor event
    TrezorConnect.on(DEVICE_EVENT, (event) => {
      if (event.type === DEVICE.CONNECT) {
        console.log('Trezor connected');
      } else if (event.type === DEVICE.DISCONNECT) {
        console.log('Trezor disconnected');
        // clear trezor list
        this.props[this.isWAN ? 'updateWANAddress' : 'updateETHAddress']('trezor');
      }
    });
  }

  componentDidUpdate() {
    if (this.props[this.isWAN ? 'trezorWANAddrList' : 'trezorETHAddrList'].length !== 0 && this.timer === undefined) {
      this.timer = setInterval(() => this.props[this.isWAN ? 'updateWANTransHistory' : 'updateETHTransHistory'](), 5000);
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
        <p className="com-gray">1. {intl.get('Trezor.installBridge')} <Icon type='link' onClick={this.handleClick} /></p>
        <p className="com-gray">2. {intl.get('Trezor.connectTrezorWalletToComputer')}</p>
      </div>
    )
  }

  setAddresses = newAddr => {
    wand.request('account_getAll', { chainID: this.isWAN ? 5718350 : 60 }, (err, ret) => {
      if (err) return;
      const hdInfoFromDb = [];
      Object.values(ret.accounts).forEach(item => {
        if (item[WALLET_ID]) {
          hdInfoFromDb.push(item[WALLET_ID]);
        }
      })
      newAddr.forEach(item => {
        const matchValue = hdInfoFromDb.find(val => val.addr === item.address.toLowerCase())
        if (matchValue) {
          item.name = matchValue.name;
        }
      });
      this.props[this.isWAN ? 'addWANTrezorAddr' : 'addETHTrezorAddr'](newAddr)
    })
  }

  getPublicKey = (cb) => {
    getPublicKey(cb, this.isWAN ? WAN_PATH : ETH_PATH);
  }

  render() {
    const { trezorWANAddrList, trezorETHAddrList, match } = this.props;
    let trezorAddrList = this.isWAN ? trezorWANAddrList : trezorETHAddrList;
    return (
      <div>
        {
          trezorAddrList.length === 0
            ? <ConnectHwWallet setAddresses={this.setAddresses} Instruction={this.instruction} getPublicKey={this.getPublicKey} chainType={this.chain} dPath={this.isWAN ? WAN_PATH : ETH_PATH} />
            : <Accounts name={['trezor']} addresses={trezorAddrList} signTransaction={signTransaction} chainType={this.chain} />
        }
      </div>
    );
  }
}

export default props => <Trezor {...props} key={props.match.params.chain}/>;
