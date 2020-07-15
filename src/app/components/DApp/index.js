import { Spin, Modal } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import { WALLETID } from 'utils/settings'
import { toWei, fromWei, toHexString, promisefy } from 'utils/support.js';
import { getNonce, getGasPrice, getChainId } from 'utils/helper';
import {
  signTransaction as trezorSignTransaction,
  signPersonalMessage as trezorSignPersonalMessage,
} from 'componentUtils/trezor'

const { confirm } = Modal;
const pu = require('promisefy-util');
const WAN_PATH = "m/44'/5718350'/0'";
@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  tokensList: stores.tokens.tokensList,
  getTokenList: stores.tokens.getTokenList,
  addrInfoForDapps: stores.wanAddress.addrInfoForDapps,
  addrSelectedList: stores.wanAddress.addrSelectedList,
  updateTokensBalance: (tokenScAddr, cb) => stores.tokens.updateTokensBalance(tokenScAddr, cb),
}))

@observer
class DApp extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, preload: null };
    this.addresses = {};

    if (!props.dAppUrl) {
      this.dAppUrl = 'https://demodex.wandevs.org/';
    } else {
      this.dAppUrl = props.dAppUrl;
      if (props.dAppUrl.startsWith('/localDapps')) {
        this.addresses.localDapp = true;
      }
    }
    this.getPreloadFile().then(preload => {
      this.setState({ preload });
      this.addEventListeners();
    })
  }

  addEventListeners = () => {
    if (this.webview || !this.state.preload) {
      return;
    }

    let webview = document.getElementById('dappView');

    if (!webview) {
      return;
    }

    webview.addEventListener('dom-ready', e => {
      this.setState({ loading: false });
      // webview.openDevTools();
    });

    webview.addEventListener('ipc-message', e => {
      const { args, channel } = e;
      if (channel === 'dapp-message') {
        this.handlerDexMessage(args[0]);
      }
      if (channel === 'iwan-message') {
        this.handlerIwanMessage(args[0]);
      }
    });

    this.webview = webview;
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
      case 'getAllAccountBalance':
        msg.err = null;
        msg.val = this.props.addrInfoForDapps;
        this.updateAddresses();
        this.sendToDAppFromWeb3(msg);
        break;
      case 'getAllAccountTokenBalance':
        msg.chainType = args[2];
        msg.tokenScAddr = args[3];
        msg.symbol = args[4];
        this.getAllAccountTokenBalance(msg);
        break;
      case 'getRegisteredMultiTokenInfo':
        msg.chainType = args[2];
        msg.scAddr = args[3];
        this.getRegisteredMultiTokenInfo(msg);
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

  handlerIwanMessage(args) {
    const msg = {
      method: args[0],
      id: args[1]
    }
    switch (msg.method) {
      case 'fetchService':
        msg.srvType = args[2];
        msg.funcName = args[3];
        msg.type = args[4];
        msg.options = args[5];
        this.fetchService(msg);
        break;
      default:
        console.log('unknown method.');
        break;
    }
  }

  async fetchService(msg) {
    msg.err = null;
    if (msg.funcName === 'claimRP') {
      let ret = await promisefy(wand.request, ['wallet_getMnemHash', {}])
      msg.options.walletID = ret.data;
    }
    try {
      let ret = await promisefy(wand.request, ['dappStore_fetchService', { srvType: msg.srvType, funcName: msg.funcName, type: msg.type, options: msg.options }]);

      if (!ret.err) {
        msg.val = ret.data;
      } else {
        msg.err = ret.err;
      }
    } catch (err) {
      msg.err = err;
    }
    this.sendToDAppfromIwan(msg);
  }

  sendToDAppFromWeb3(msg) {
    if (!this.webview) {
      this.webview = document.getElementById('dappView');
    }
    this.webview.send('dapp-message', msg);
  }

  sendToDAppfromIwan(msg) {
    if (!this.webview) {
      this.webview = document.getElementById('dappView');
    }
    this.webview.send('iwan-message', msg);
  }

  updateAddresses() {
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
  }

  getAddresses(msg) {
    msg.err = null;
    msg.val = [];
    try {
      // let chainID = 5718350;
      // let val = await pu.promisefy(wand.request, ['account_getAll', { chainID: chainID }]);
      // let addrs = [];
      // for (var account in val.accounts) {
      //   if (Object.prototype.hasOwnProperty.call(val.accounts[account], '1')) {
      //     addrs.push(val.accounts[account]['1'].addr);
      //   }
      // }
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
    this.sendToDAppFromWeb3(msg);
  }

  getAllAccountTokenBalance(msg) {
    msg.val = {};
    let token = this.props.getTokenList.find(item => item.addr === msg.tokenScAddr)
    if (token && token.select) {
      this.props.updateTokensBalance(msg.tokenScAddr, (err, data) => {
        if (err) {
          this.props.addrInfoForDapps.forEach(item => { msg.val[item.address] = '0' })
          this.getAllAccountTokenBalance(msg);
        } else {
          this.props.addrInfoForDapps.forEach(item => {
            if (data[item.address]) {
              msg.val[item.address] = data[item.address]
            } else {
              msg.val[item.address] = '0'
            }
          })
          this.sendToDAppFromWeb3(msg);
        }
      })
    } else {
      this.props.addrInfoForDapps.forEach(item => { msg.val[item.address] = '0' })
      this.sendToDAppFromWeb3(msg);
    }
  }

  getRegisteredMultiTokenInfo(msg) {
    msg.val = {};
    try {
      let len = msg.scAddr.length;
      msg.scAddr.forEach(async item => {
        let ret1 = await promisefy(wand.request, ['crossChain_getTokenInfo', { scAddr: item, chain: msg.chainType }]);
        if (!ret1.err) {
          msg.val[item] = {
            scAddr: item,
            symbol: ret1.data.symbol,
            decimals: ret1.data.decimals
          }
        }

        if (this.props.getTokenList[item] && this.props.getTokenList[item].buddy) {
          let ret2 = await promisefy(wand.request, ['crossChain_getRegisteredToken', { tokenOrigAccount: item }]);
          if (!ret2.err && ret2.data.length !== 0) {
            msg.val[item].iconData = ret2.data[0].iconData;
            msg.val[item].iconType = ret2.data[0].iconType;
            len = len - 1;
            if (len === 0) {
              msg.val = Object.values(msg.val)
              this.sendToDAppFromWeb3(msg);
            }
          }
        } else {
          let ret3 = await promisefy(wand.request, ['crossChain_getRegisteredOrigToken', { tokenScAddr: item, chain: msg.chainType }]);
          if (!ret3.err && ret3.data.length !== 0) {
            msg.val[item].iconData = ret3.data[0].iconData;
            msg.val[item].iconType = ret3.data[0].iconType;
            len = len - 1;
            if (len === 0) {
              msg.val = Object.values(msg.val)
              this.sendToDAppFromWeb3(msg);
            }
          }
        }
      })
    } catch (err) {
      msg.err = err;
      this.sendToDAppFromWeb3(msg);
      console.log('getRegisteredMultiTokenInfo:', err)
    }
  }

  loadNetworkId(msg) {
    msg.err = null;
    msg.val = 3;
    wand.request('query_config', { param: 'network' }, (err, val) => {
      if (err) {
        console.log('error printed inside callback: ', err);
        msg.err = err;
      } else {
        if (val.network === 'testnet') {
          msg.val = 3;
        } else {
          msg.val = 1;
        }
        this.sendToDAppFromWeb3(msg);
      }
    });
  }

  async getWalletFromAddress(address) {
    try {
      address = address.toLowerCase();
      if (!this.addresses[address]) {
        return '';
      }
      const { addrInfo } = this.props;

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
      let index = Object.keys(addrInfo[addrType]).findIndex(val => val.toLowerCase() === address);
      let addr = '';
      if (index !== -1) {
        addr = Object.keys(addrInfo[addrType])[index];
      }
      let path = addrInfo[addrType][addr] && addrInfo[addrType][addr]['path'];
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
    await this.showConfirm('sign', msg, async (msg) => {
      msg.err = null;
      msg.val = null;

      const wallet = await this.getWalletFromAddress(msg.address);

      if (wallet.id === WALLETID.TREZOR) {
        try {
          let sig = await trezorSignPersonalMessage(wallet.path, msg.message);
          msg.val = sig;
        } catch (error) {
          console.log(error);
          msg.err = error;
        }
        this.sendToDAppFromWeb3(msg);
      } else {
        wand.request('wallet_signPersonalMessage', { walletID: wallet.id, path: wallet.path, rawTx: msg.message }, (err, sig) => {
          if (err) {
            msg.err = err;
            console.log(`Sign Failed:`, JSON.stringify(err));
          } else {
            msg.val = sig;
          }
          this.sendToDAppFromWeb3(msg);
        });
      }
    }, async (msg) => {
      msg.err = 'The user rejects in the wallet.';
      this.sendToDAppFromWeb3(msg);
    });
  }

  async nativeSendTransaction(msg, wallet) {
    let gasPrice = await getGasPrice('wan');
    let amountInWei = new BigNumber(msg.message.value)
    let trans = {
      walletID: wallet.id,
      chainType: 'WAN',
      symbol: 'WAN',
      path: wallet.path,
      to: msg.message.to,
      amount: amountInWei.div(1e18),
      gasLimit: msg.message.gasLimit ? toHexString(msg.message.gasLimit) : `0x${(2000000).toString(16)}`,
      gasPrice: msg.message.gasPrice ? fromWei(msg.message.gasPrice, 'Gwei') : gasPrice,
      data: msg.message.data
    };

    wand.request('transaction_normal', trans, function (err, val) {
      if (err) {
        console.log('error printed inside callback: ', err)
        msg.err = err;
      } else {
        if (val.code === false) {
          msg.err = new Error(val.result);
        } else {
          msg.val = val.result;
        }
      }
      this.sendToDAppFromWeb3(msg);
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
      rawTx.gasLimit = msg.message.gasLimit ? toHexString(msg.message.gasLimit) : `0x${(2000000).toString(16)}`;
      rawTx.gasPrice = msg.message.gasPrice ? msg.message.gasPrice : toWei(gasPrice, 'gwei');
      rawTx.Txtype = Number(1);
      rawTx.chainId = chainId;
      let raw = await pu.promisefy(trezorSignTransaction, [wallet.path, rawTx]);
      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }]);
      msg.val = txHash;
    } catch (error) {
      console.log(error)
      msg.err = error;
    }

    this.sendToDAppFromWeb3(msg);
  }

  async sendTransaction(msg) {
    await this.showConfirm('send', msg, async (msg) => {
      msg.err = null;
      msg.val = null;
      if (!msg.message || !msg.message.from) {
        msg.err = 'can not find from address.';
        this.sendToDAppFromWeb3(msg);
        return;
      }

      const wallet = await this.getWalletFromAddress(msg.message.from);
      if (wallet.id === WALLETID.TREZOR) {
        await this.trezorSendTransaction(msg, wallet);
      } else {
        await this.nativeSendTransaction(msg, wallet);
      }
    }, async (msg) => {
      msg.err = 'The user rejects in the wallet.';
      this.sendToDAppFromWeb3(msg);
    });
  }

  getPreloadFile() {
    return pu.promisefy(wand.request, ['setting_getDAppInjectFile']);
  }

  async showConfirm(type, msg, onOk, onCancel) {
    let title = '';
    if (type === 'sign') {
      title = intl.get('dAppConfirm.sign');
    } else {
      title = intl.get('dAppConfirm.send');
    }

    confirm({
      title: title,
      content: intl.get('dAppConfirm.warn'),
      okText: intl.get('ValidatorRegister.acceptAgency'),
      cancelText: intl.get('ValidatorRegister.notAcceptAgency'),
      async onOk() {
        await onOk(msg);
      },
      async onCancel() {
        await onCancel(msg);
      },
    });
  }

  renderLoadTip = () => {
    return (
      <div>
        {/* Loading... */}
        {/* <br />
        <br />
        If you're using it for the first time, it might take a few minutes... */}
      </div>
    );
  }

  render() {
    const preload = this.state.preload;

    if (preload) {
      return (
        <div className={style.myIframe}>
        {this.state.loading
          ? <Spin
            style={{ margin: '60px 0px 0px 60px' }}
            tip={this.renderLoadTip()}
            size="large"
          /> : null}

          <webview
            id="dappView"
            src={this.props.dAppUrl}
            style={{ width: '100%', height: '100%' }}
            nodeintegration="on"
            preload={preload}
            allowpopups="on"
            // disablewebsecurity={true}
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
