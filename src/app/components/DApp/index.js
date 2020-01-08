import React, { Component } from 'react';
import { Spin } from 'antd';
import style from './index.less';
import { WALLETID } from 'utils/settings'
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import {
  signPersonalMessage as trezorSignPersonalMessage,
  signTransaction as trezorSignTransaction
 } from 'componentUtils/trezor'
 import { toWei } from 'utils/support.js';
import { getNonce, getGasPrice, getChainId } from 'utils/helper';

const pu = require('promisefy-util');
const WAN_PATH = "m/44'/5718350'/0'";
@inject(stores => ({
  addrSelectedList: stores.wanAddress.addrSelectedList,
  addrInfo: stores.wanAddress.addrInfo,
}))

@observer
class DApp extends Component {
  constructor (props) {
    super(props);
    this.state = { loading: true, preload: null };
    if (!props.dAppUrl) {
      this.dAppUrl = 'https://demodex.wandevs.org/';
    } else {
      this.dAppUrl = props.dAppUrl;
    }
    this.addresses = {};
  }

  async componentDidMount () {
    this.setState({ loading: true });
    const preload = await this.getPreloadFile()
    console.log(preload);
    this.setState({ preload: preload });
    this.addEventListeners();
  }

  addEventListeners = () => {
    if (this.webview || !this.state.preload) {
      return;
    }

    var webview = document.getElementById('dappView');

    if (!webview) {
      return;
    }

    webview.addEventListener('dom-ready', function(e) {
      this.setState({ loading: false });
      webview.openDevTools();
    }.bind(this));

    webview.addEventListener('ipc-message', function(event) {
      const { args, channel } = event;
      if (channel === 'dapp-message') {
        this.handlerDexMessage(args[0]);
      }
    }.bind(this));

    this.webview = webview;
  }

  componentWillUnmount () {
  }

  handlerDexMessage(args) {
    const msg = {
      method: args[0],
      id: args[1]
    }
    switch (msg.method) {
      case 'getAddresses':
        this.getAddresses(msg);
        break;
      case 'loadNetworkId':
        this.loadNetworkId(msg);
        break;
      case 'signPersonalMessage':
        msg.message = args[2];
        msg.address = args[3];
        this.signPersonalMessage(msg);
        break;
      case 'sendTransaction':
        msg.message = args[2];
        this.sendTransaction(msg);
        break;
      default:
        console.log('unknown method.');
        break;
    }
  }

  sendToDApp(msg) {
    if (!this.webview) {
      this.webview = document.getElementById('dappView');
    }
    this.webview.send('dapp-message', msg);
  }

  async getAddresses(msg) {
    msg.err = null;
    msg.val = [];

    try {
      let chainID = 5718350;
      let val = await pu.promisefy(wand.request, ['account_getAll', { chainID: chainID }]);
      console.log(val);
      let addrs = [];
      for (var account in val.accounts) {
        console.log(account);
        addrs.push(val.accounts[account]['1'].addr);
      }
      let addrAll = this.props.addrSelectedList.slice();
      for (var i = 0, len = addrAll.length; i < len; i++) {
        const addr = addrAll[i];
        addrAll[i] = addrAll[i].replace(/^Ledger: /, '').toLowerCase();
        addrAll[i] = addrAll[i].replace(/^trezor: /, '').toLowerCase();

        this.addresses[addrAll[i]] = {};
        if (addr.indexOf('Ledger') !== -1) {
          this.addresses[addrAll[i]].walletID = WALLETID.LEDGER;
        } else if (addr.indexOf('Trezor') !== -1) {
          this.addresses[addrAll[i]].walletID = WALLETID.TREZOR;
        } else {
          this.addresses[addrAll[i]].walletID = WALLETID.NATIVE;
        }
      }
      msg.val = addrAll;
    } catch (error) {
      console.log(error);
      msg.err = error;
    }
    this.sendToDApp(msg);
  }

  loadNetworkId(msg) {
    msg.err = null;
    msg.val = 3;
    wand.request('query_config', {
        param: 'network'
      },
      function(err, val) {
        if (err) {
          console.log('error printed inside callback: ', err);
          msg.err = err;
        } else {
          if (val.network === 'testnet') {
            msg.val = 3;
          } else {
            msg.val = 1;
          }
          this.sendToDApp(msg);
        }
    }.bind(this));
  }

  async getWalletFromAddress(address) {
    try {
      if (!this.addresses[address]) {
        return '';
      }
      const { addrInfo } = this.props;

      console.log('addresses:', this.addresses);
      let addrType = '';
      switch (this.addresses[address].walletID) {
        case WALLETID.NATIVE:
          addrType = 'normal';
          break;
        case WALLETID.LEDGER:
          addrType = 'ledger';
          break;
        case WALLETID.TREZOR:
          addrType = 'trezor';
          break;
      }
      console.log('addrInfo:', addrInfo[addrType]);
      let index = Object.keys(addrInfo[addrType]).findIndex(val => val.toLowerCase() === address);
      let addr = '';
      if (index !== -1) {
        addr = Object.keys(addrInfo[addrType])[index];
        console.log('index:', index, addr);
      }
      let path = addrInfo[addrType][addr] && addrInfo[addrType][addr]['path'];
      console.log('new path:', path, address);
      if (path.indexOf('m') === -1) {
        path = WAN_PATH + '/0/' + path;
      }
      return {
        id: this.addresses[address].walletID,
        path: path,
      }
    } catch (error) {
      console.log('getWalletFromAddress error', error);
    }
  }

  async signPersonalMessage(msg) {
    msg.err = null;
    msg.val = null;

    const wallet = await this.getWalletFromAddress(msg.address);
    console.log('ready to sign message with:', wallet);

    if (wallet.id === WALLETID.TREZOR) {
      try {
        let sig = await trezorSignPersonalMessage(wallet.path, msg.message);
        msg.val = sig;
      } catch (error) {
        console.log(error);
        msg.err = error;
      }
      this.sendToDApp(msg);
    } else {
      wand.request('wallet_signPersonalMessage', { walletID: wallet.id, path: wallet.path, rawTx: msg.message }, (err, sig) => {
        if (err) {
          msg.err = err;
          console.log(`Sign Failed:`, JSON.stringify(err));
        } else {
          console.log('Signature: ', sig)
          msg.val = sig;
        }
        this.sendToDApp(msg);
      });
    }
  }

  async nativeSendTransaction(msg, wallet) {
    let amountInWei = new BigNumber(msg.message.value)
    let trans = {
      walletID: wallet.id,
      chainType: 'WAN',
      symbol: 'WAN',
      path: wallet.path,
      to: msg.message.to,
      amount: amountInWei.div(1e18),
      gasLimit: `0x${(2000000).toString(16)}`,
      gasPrice: 200,
      data: msg.message.data
    };

    console.log('trans:', trans);
    wand.request('transaction_normal', trans, function(err, val) {
        if (err) {
          console.log('error printed inside callback: ', err)
          msg.err = err;
        } else {
          console.log('result:', val);
          if (val.code === false) {
            msg.err = new Error(val.result);
          } else {
            msg.val = val.result;
          }
        }
        this.sendToDApp(msg);
      }.bind(this)
    );
  }

  async trezorSendTransaction(msg, wallet) {
    let chainId = await getChainId();
    try {
      let nonce = await getNonce(msg.message.from, 'wan');
      let gasPrice = await getGasPrice('wan');
      let data = msg.message.data;
      let amountWei = msg.message.value;
      let rawTx = {};
      rawTx.from = msg.message.from;
      rawTx.to = msg.message.to;
      rawTx.value = amountWei ? '0x' + Number(amountWei).toString(16) : '0x00';
      rawTx.data = data;
      rawTx.nonce = '0x' + nonce.toString(16);
      rawTx.gasLimit = '0x' + Number(800000).toString(16);
      rawTx.gasPrice = toWei(gasPrice, 'gwei');
      rawTx.Txtype = Number(1);
      rawTx.chainId = chainId;
      console.log('rawTx:', rawTx);
      let raw = await pu.promisefy(trezorSignTransaction, [wallet.path, rawTx]);
      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }]);
      console.log('Transaction hash:', txHash);
      msg.val = txHash;
    } catch (error) {
      console.log(error)
      msg.err = error;
    }

    this.sendToDApp(msg);
  }

  async sendTransaction(msg) {
    msg.err = null;
    msg.val = null;
    console.log('msg:', msg);
    console.log('ready to sendTx:', msg.message);
    if (!msg.message || !msg.message.from) {
      msg.err = 'can not find from address.';
      this.sendToDApp(msg);
      return;
    }

    const wallet = await this.getWalletFromAddress(msg.message.from);
    console.log('ready to send tx with:', wallet);

    if (wallet.id === WALLETID.TREZOR) {
      await this.trezorSendTransaction(msg, wallet);
    } else {
      await this.nativeSendTransaction(msg, wallet);
    }
  }

  async getPreloadFile() {
    return pu.promisefy(wand.request, ['setting_getDAppInjectFile']);
  }

  renderLoadTip = () => {
    return (
      <div>
        Loading...
        <br/>
        <br/>
        If you're using it for the first time, it might take a few minutes...
      </div>
    );
  }

  render () {
    const preload = this.state.preload;
    console.log('preload:', preload);
    if (preload) {
      return (
        <div className={style.myIframe}>
          {this.state.loading
          ? <Spin
          tip={this.renderLoadTip()} size="large"/> : null}
          <webview
          id="dappView"
          src={this.dAppUrl}
          style={ { width: '100%', height: '100%' } }
          nodeintegration="on"
          preload={ preload }
          allowpopups="on"
          >
          Your electron doesn't support webview, please set webviewTag: true.
          </webview>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default DApp;
