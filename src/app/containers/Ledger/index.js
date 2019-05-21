import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { message } from 'antd';

import './index.less';
import { wanTx, WanRawTx } from 'utils/hardwareUtils'
import Accounts from 'components/HwWallet/Accounts';
import ConnectHwWallet from 'components/HwWallet/Connect';

const DPATH = "m/44'/5718350'/0'";
const WALLETID = 0x02;
const CHAINTYPE = 'WAN';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  addLedgerAddr: newAddr => stores.wanAddress.addLedgerAddress(newAddr)
}))

@observer
class Ledger extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Ledger');
  }

  componentDidUpdate() {
    if(this.props.ledgerAddrList.length !== 0 && !this.timer) {
      this.timer = setInterval(() => this.props.updateTransHistory(), 5000);
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
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
    wand.request('wallet_isConnected', { walletID: WALLETID }, (err, connected) => {
      if (err) return;
      if (connected) {
        this.getPublicKey(callback);
      } else {
        console.log("connect to ledger")
        wand.request('wallet_connectToLedger', {}, (err, val) => {
          if (err) {
            callback(err, val);
          } else {
            this.getPublicKey(callback);
          }
        });
      }
    });
  }

  getPublicKey = callback => {
    wand.request('wallet_getPubKeyChainId', {
      walletID: WALLETID,
      path: DPATH
    }, (err, val) => {
      callback(err, val);
    });
  }

  signTransaction = (path, tx, callback) => {
    let rawTx = new WanRawTx(tx).serialize();
    
    message.info('Please Sign transaction in Ledger');
    wand.request('wallet_signTransaction', { walletID: WALLETID, path: path, rawTx: rawTx }, (err, sig) => {
      if (err) {
        message.warn('Sign transaction failed. Please try again');
        callback(err, null);

        console.log(`Sign Failed: ${err}`);
      } else {
        console.log("signature", sig)
        tx.v = sig.v;
        tx.r = sig.r;
        tx.s = sig.s;
        console.log("trans", tx)
        let wTx = new wanTx(tx);
        let signedTx = '0x' + wTx.serialize().toString('hex');
        console.log(signedTx);
        callback(null, signedTx);
      }
    });
  }

  render() {
    const { ledgerAddrList, addLedgerAddr } = this.props;
    return (
      <div>
        {
          ledgerAddrList.length === 0
            ? <ConnectHwWallet setAddresses={addLedgerAddr} Instruction={this.instruction} getPublicKey={this.connectAndGetPublicKey} dPath={DPATH} />
            : <Accounts name="ledger" addresses={ledgerAddrList} signTransaction={this.signTransaction} chainType={CHAINTYPE} />
        }
      </div>
    );
  }
}

export default Ledger;
