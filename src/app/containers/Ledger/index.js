import React, { Component } from 'react';
import './index.less';
import ConnectHwWallet from 'components/HwWallet/Connect';
import Accounts from 'components/HwWallet/Accounts';
import { observer, inject } from 'mobx-react';
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
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.dPath = "m/44'/5718350'/0'";
    this.walletID = 0x02;
    this.connectLedger = false;
    this.state = {
      visible: false,
      // addresses: [{ key: "0xf19137479fc2708d97fd1f67bfbfd8ebfc8fccd0", address: "0xf19137479fc2708d97fd1f67bfbfd8ebfc8fccd0", balance: 0, path: "m/44'/5718350'/0'/0/0" },
      // { key: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", address: "0xaa0ade20ee35f2f1dcaa0686315b5680d6c0a4e5", balance: 0, path: "m/44'/5718350'/0'/0/0" }
      // ],
      addresses: []
    };
  }

  instruction = () => {
    return (
      <div>
        <h2 className="com-yellow">Please follow the below instructions to connect your Ledger wallet:</h2>
        <p className="com-white">1. Connect your Ledger wallet directly to your computer.</p>
        <p className="com-white">2. Enter pin code to unlock your Ledger wallet.</p>
        <p className="com-white">3. Navigate to Wanchain APP and enter into it.</p>
      </div>
    )
  }

  componentWillMount() {
    this.props.changeTitle('Ledger')
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

  connectAndGetPublicKey = (callback) => {
    wand.request('wallet_isConnected', { walletID: this.walletID }, (err, connected) => {
      if (err) {
        return;
      } else {
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
      }
    });
  }

  getPublicKey = (callback) => {
    wand.request('wallet_getPubKeyChainId', {
      walletID: this.walletID,
      path: this.dPath
    }, function (err, val) {
      console.log("publickey", err, val);
      callback(err, val);
    });
  }

  signTransaction = (path, tx, callback) => {
    let eTx = new WanRawTx(tx);
    let rawTx = eTx.serialize();;

    console.log("etx", eTx)
    console.log("rawTx", rawTx)
    wand.request('wallet_signTransaction', {
      walletID: this.walletID,
      path: path,
      rawTx: rawTx
    }, (err, sig) => {
      if (err) {
        message.warn("Sign transaction failed. Please try again");
        console.log("Sign failed", err);
      } else {
        console.log("sigature", sig)
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
    return (
      <div>
        {
          this.state.addresses.length === 0 ? <ConnectHwWallet setAddresses={this.setAddresses}
            Instruction={this.instruction} getPublicKey={this.connectAndGetPublicKey}
            dPath={this.dPath} /> : <Accounts addresses={this.state.addresses} signTransaction={this.signTransaction} />
        }
      </div>
    );
  }
}

export default Ledger;
