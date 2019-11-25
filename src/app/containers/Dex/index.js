import React, { Component } from 'react';
import { Spin } from 'antd';
import style from './index.less';
import { WALLETID } from 'utils/settings'
import { BigNumber } from 'bignumber.js';
const pu = require('promisefy-util');

class Dex extends Component {
  constructor (props) {
    super(props);
    this.state = { loading: true };
    this.dexUrl = 'https://demodex.wandevs.org/';
    this.preload = 'file:///Users/molin/workspace/wan-wallet-desktop/src/modules/preload/dexInject.js';
    console.log(this.preload);
  }

  componentDidMount () {
    this.setState({ loading: true });
    var webview = document.getElementById('dexView');

    webview.addEventListener('dom-ready', function(e) {
      this.setState({ loading: false });
      webview.openDevTools();
    }.bind(this));

    webview.addEventListener('ipc-message', function(event) {
      const { args, channel } = event;
      console.log('received ipc message:', channel, args);
      if (channel === 'dex-message') {
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
    console.log('dex-message:', msg);
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
        msg.address = args[3];
        this.sendTransaction(msg);
        break;
      default:
        console.log('unknown method.');
        break;
    }
  }

  sendToDex(msg) {
    if (!this.webview) {
      this.webview = document.getElementById('dexView');
    }
    this.webview.send('dex-message', msg);
  }

  async getAddresses(msg) {
    msg.err = null;
    msg.val = [];

    try {
      let chainID = 5718350;
      const val = await pu.promisefy(wand.request, ['account_getAll', { chainID: chainID }]);
      console.log(val);
      let addrs = [];
      for (var account in val.accounts) {
        console.log(account);
        addrs.push(val.accounts[account]['1'].addr);
      }
      console.log(addrs);
      msg.val = addrs;
      // TODO: Add hardware wallet
    } catch (error) {
      console.log(error);
      msg.err = error;
    }
    this.sendToDex(msg);
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
          this.sendToDex(msg);
        }
    }.bind(this));
  }

  async getWalletFromAddress(address) {
    try {
      let chainID = 5718350;
      const val = await pu.promisefy(wand.request, ['account_getAll', { chainID: chainID }]);
      for (var account in val.accounts) {
        console.log('compare:', address, val.accounts[account]['1'].addr);
        if (address === val.accounts[account]['1'].addr) {
          return {
            id: WALLETID.NATIVE,
            path: account
          }
        }
      }

      // TODO: Add hardware wallet
    } catch (error) {
      console.log('getWalletFromAddress error', error);
    }
  }

  async signPersonalMessage(msg) {
    msg.err = null;
    msg.val = null;

    const wallet = await this.getWalletFromAddress(msg.address);
    console.log('ready to sign message with:', wallet);

    wand.request('wallet_signPersonalMessage', { walletID: wallet.id, path: wallet.path, rawTx: msg.message }, (err, sig) => {
      if (err) {
        msg.err = err;
        console.log(`Sign Failed:`, JSON.stringify(err));
      } else {
        console.log('Signature: ', sig)
        msg.val = sig;
      }
      this.sendToDex(msg);
    });
  }

  async sendTransaction(msg) {
    msg.err = null;
    msg.val = null;
    console.log('ready to sendTx:', msg.message);
    const wallet = await this.getWalletFromAddress(msg.address);
    console.log('ready to send tx with:', wallet);

    let amountInWei = new BigNumber(msg.message.value)

    let trans = {
      walletID: wallet.id,
      chainType: 'WAN',
      symbol: 'WAN',
      path: wallet.path,
      to: msg.message.to,
      amount: amountInWei.div(1e18),
      gasLimit: `0x${(200000).toString(16)}`,
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
        this.sendToDex(msg);
      }.bind(this)
    );
  }

  render () {
    return (
      <div className={style.myIframe}>
        {this.state.loading ? <Spin tip="Loading..." size="large"/> : null}
        <webview
          id="dexView"
          src={this.dexUrl}
          style={ { width: '100%', height: '100%' } }
          nodeintegration="on"
          preload={ this.preload }
          allowpopups="on"
          >
        Your electron doesn't support webview, please set webviewTag: true.
        </webview>
      </div>
    );
  }
}

export default Dex;
