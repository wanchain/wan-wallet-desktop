import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { message } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';
import { WALLETID } from 'utils/settings';
import { WanTx, WanRawTx } from 'utils/hardwareUtils'
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const WAN_PATH = "m/44'/5718350'/0'";
const ETH_PATH = "m/44'/60'/0'";
const CHAIN_TYPE = 'WAN';
const LEDGER = 'ledger';

@inject(stores => ({
  language: stores.languageIntl.language,
  ledgerWANAddrList: stores.wanAddress.ledgerAddrList,
  ledgerETHAddrList: stores.ethAddress.ledgerAddrList,
  updateWANTransHistory: () => stores.wanAddress.updateTransHistory(),
  updateETHTransHistory: () => stores.ethAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  addWANLedgerAddr: newAddr => stores.wanAddress.addAddresses(LEDGER, newAddr),
  addETHLedgerAddr: newAddr => stores.ethAddress.addAddresses(LEDGER, newAddr),
  setCurrTokenChain: chain => stores.tokens.setCurrTokenChain(chain),
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.chain = props.match.params.chain || CHAIN_TYPE;
    this.isWAN = this.chain === CHAIN_TYPE;
    this.props.changeTitle('Ledger.ledger');
    this.props.setCurrTokenChain(this.chain);
  }

  componentDidUpdate() {
    if (this.props[`ledger${this.props.match.params.chain || CHAIN_TYPE}AddrList`].length !== 0 && this.timer === undefined) {
      this.timer = setInterval(() => this.props[`update${this.props.match.params.chain || CHAIN_TYPE}TransHistory`](), 5000);
    }
  }

  componentDidMount() {
    if (this.props[`ledger${this.chain}AddrList`].length !== 0 && this.timer === undefined) {
      this.timer = setInterval(() => this.props[`update${this.chain || CHAIN_TYPE}TransHistory`](), 5000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  instruction = () => {
    return (
      <div>
        <p className="com-gray">1. {intl.get('Ledger.connectLedgerWalletToComputer')} </p>
        <p className="com-gray">2. {intl.get('Ledger.enterPinCode')}</p>
        <p className="com-gray">3. {intl.get('Ledger.navigateToWanchainAPPAndEnterIntoIt')}</p>
        <p className="com-gray">4. {intl.get('Ledger.setContractDataOn')}</p>
      </div>
    )
  }

  connectAndGetPublicKey = callback => {
    wand.request('wallet_connectToLedger', {}, (err, val) => {
      if (err) {
        callback(err, val);
      } else {
        this.getPublicKey(callback);
      }
    });
  }

  handleCancel = () => {
    wand.request('wallet_deleteLedger');
  }

  getPublicKey = callback => {
    wand.request('wallet_getPubKeyChainId', {
      walletID: WALLETID.LEDGER,
      path: this.isWAN ? WAN_PATH : ETH_PATH
    }, (err, val) => {
      callback(err, val);
    });
  }

  signTransaction = (path, tx, callback) => {
    let rawTx = new WanRawTx(tx).serialize();
    message.info(intl.get('Ledger.signTransactionInLedger'));
    console.log('sign param:', { walletID: WALLETID.LEDGER, path: path, rawTx: rawTx });
    wand.request('wallet_signTransaction', { walletID: WALLETID.LEDGER, path: path, rawTx: rawTx }, (err, sig) => {
      if (err) {
        message.warn(intl.get('Ledger.signTransactionFailed'));

        /* err: {
          cat: "EthAppPleaseEnableContractData"
          desc: "Please enable Contract data on the Ethereum app Settings"
        } */

        callback(err, null);
        console.log(`Sign Failed:`, err);
      } else {
        tx.v = sig.v;
        tx.r = sig.r;
        tx.s = sig.s;
        let wTx = new WanTx(tx);
        let signedTx = '0x' + wTx.serialize().toString('hex');
        console.log('Signed tx: ', signedTx);
        callback(null, signedTx);
      }
    });
  }

  setAddresses = newAddr => {
    wand.request('account_getAll', { chainID: this.isWAN ? 5718350 : 60 }, (err, ret) => {
      if (err) return;
      let hdInfoFromDb = [];
      console.log('getAll:', ret);
      Object.values(ret.accounts).forEach(item => {
        if (item[WALLETID.LEDGER]) {
          hdInfoFromDb.push(item[WALLETID.LEDGER]);
        }
      })
      newAddr.forEach(item => {
        let matchValue = hdInfoFromDb.find(val => val.addr === item.address.toLowerCase())
        if (matchValue) {
          item.name = matchValue.name;
        }
      });
      this.props[`add${this.chain}LedgerAddr`](newAddr)
    })
  }

  render() {
    const ledgerAddrList = this.props[`ledger${this.chain}AddrList`];
    return (
      <div>
        {
          ledgerAddrList.length === 0
            ? <ConnectHwWallet onCancel={this.handleCancel} setAddresses={this.setAddresses} Instruction={this.instruction} getPublicKey={this.connectAndGetPublicKey} chainType={this.chain} dPath={this.isWAN ? WAN_PATH : ETH_PATH} />
            : <Accounts name={['ledger']} addresses={ledgerAddrList} signTransaction={this.signTransaction} chainType={this.chain} />
        }
      </div>
    );
  }
}

export default props => <Ledger {...props} key={props.match.params.chain}/>;
