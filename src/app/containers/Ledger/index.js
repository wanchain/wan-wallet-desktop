import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { message } from 'antd';

import './index.less';
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const wanTx = require('wanchainjs-tx');
const ethUtil = require('ethereumjs-util');

class WanRawTx {
  constructor(data) {
    const fields = [{
      name: 'Txtype',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'nonce',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasPrice',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'gasLimit',
      alias: 'gas',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'to',
      allowZero: true,
      length: 20,
      default: new Buffer([])
    }, {
      name: 'value',
      length: 32,
      allowLess: true,
      default: new Buffer([])
    }, {
      name: 'data',
      alias: 'input',
      allowZero: true,
      default: new Buffer([])
    }, {
      name: 'chainId',
      length: 32,
      allowLess: true,
      default: new Buffer([0x01])
    }, {
      name: 'dumb1',
      length: 32,
      allowLess: true,
      allowZero: false,
      default: new Buffer([0x00])
    }, {
      name: 'dumb2',
      length: 32,
      allowLess: true,
      allowZero: false,
      default: new Buffer([0x00])
    }]

    ethUtil.defineProperties(this, fields, data)
  }
}

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  addLedgerAddr: newAddr => stores.wanAddress.addLedgerAddress(newAddr)
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.dPath = "m/44'/5718350'/0'";
    this.walletID = 0x02;
    this.chainType = 'WAN';
    this.connectLedger = false;
    this.props.changeTitle('Ledger');
  }

  instruction = () => {
    return (
      <div className="">
        <h2 className="com-gray">Please follow the below instructions to connect your Ledger wallet:</h2>
        <div className="ledgerTex">
          <p>1. Connect your Ledger wallet directly to your computer</p>
          <p>2. Enter pin code to unlock your Ledger wallet</p>
          <p>3. Navigate to Wanchain APP and enter into it</p>
        </div>
      </div>
    )
  }

  connectAndGetPublicKey = callback => {
    wand.request('wallet_isConnected', { walletID: this.walletID }, (err, connected) => {
      if (err) return;
      if (connected) {
        this.getPublicKey(callback);
      } else {
        console.log("connect to ledger")
        wand.request('wallet_connectToLedger', {}, (err, val) => {
          if (err) {
            callback(err, val);
          } else {
            this.connectLedger = true;
            this.getPublicKey(callback);
          }
        });
      }
    });
  }

  getPublicKey = (callback) => {
    wand.request('wallet_getPubKeyChainId', {
      walletID: this.walletID,
      path: this.dPath
    }, function (err, val) {
      callback(err, val);
    });
  }

  signTransaction = (path, tx, callback) => {
    let eTx = new WanRawTx(tx), rawTx = eTx.serialize();
    console.log("etx", eTx);
    console.log("rawTx", rawTx);

    wand.request('wallet_signTransaction', { walletID: this.walletID, path: path, rawTx: rawTx }, (err, sig) => {
      if (err) {
        message.warn('Sign transaction failed. Please try again');
        console.log("Sign failed", err);
      } else {
        console.log("signature", sig)
        tx.v = sig.v;
        tx.r = sig.r;
        tx.s = sig.s;

        console.log("trans", tx)

        let wTx = new wanTx(tx);
        let signedTx = '0x' + wTx.serialize().toString('hex');
        console.log(signedTx);
  
        callback(signedTx);
      }
    });
  }

  render() {
    const { ledgerAddrList, addLedgerAddr } = this.props;
    return (
      <div>
        {
          ledgerAddrList.length === 0
            ? <ConnectHwWallet setAddresses={addLedgerAddr} Instruction={this.instruction} getPublicKey={this.connectAndGetPublicKey} dPath={this.dPath} />
            : <Accounts name="ledger" addresses={ledgerAddrList} signTransaction={this.signTransaction} chainType={this.chainType} />
        }
      </div>
    );
  }
}

export default Ledger;
