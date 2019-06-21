import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { message } from 'antd';
import intl from 'react-intl-universal';

import './index.less';
import { wanTx, WanRawTx } from 'utils/hardwareUtils'
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const WAN_PATH = "m/44'/5718350'/0'";
const WALLET_ID = 0x02;
const CHAIN_TYPE = 'WAN';
const LEDGER = 'ledger';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  addLedgerAddr: newAddr => stores.wanAddress.addAddresses(LEDGER, newAddr)
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Ledger.ledger');
  }

  componentDidUpdate() {
    if (this.props.ledgerAddrList.length !== 0 && !this.timer) {
      this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
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
      </div>
    )
  }

  connectAndGetPublicKey = callback => {
    console.log("connect to ledger")
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
      walletID: WALLET_ID,
      path: WAN_PATH
    }, (err, val) => {
      callback(err, val);
    });
  }

  signTransaction = (path, tx, callback) => {
    let rawTx = new WanRawTx(tx).serialize();

    message.info(intl.get('Ledger.signTransactionInLedger'));
    wand.request('wallet_signTransaction', { walletID: WALLET_ID, path: path, rawTx: rawTx }, (err, sig) => {
      if (err) {
        message.warn(intl.get('Ledger.signTransactionFailed'));
        callback(err, null);

        console.log(`Sign Failed: ${err}`);
      } else {
        console.log("Signature: ", sig)
        tx.v = sig.v;
        tx.r = sig.r;
        tx.s = sig.s;
        console.log("Tx:", tx)
        let wTx = new wanTx(tx);
        let signedTx = '0x' + wTx.serialize().toString('hex');
        console.log("Signed tx:", signedTx);
        callback(null, signedTx);
      }
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
      this.props.addLedgerAddr(newAddr)
    })
  }

  render() {
    const { ledgerAddrList } = this.props;
    return (
      <div>
        {
          ledgerAddrList.length === 0
            ? <ConnectHwWallet onCancel={this.handleCancel} setAddresses={this.setAddresses} Instruction={this.instruction} getPublicKey={this.connectAndGetPublicKey} dPath={WAN_PATH} />
            : <Accounts name={['ledger']} addresses={ledgerAddrList} signTransaction={this.signTransaction} chainType={CHAIN_TYPE} />
        }
      </div>
    );
  }
}

export default Ledger;
