import React, { Component } from 'react';
import { Button, Form, message } from 'antd';
import './index.less';
import DelegateOutConfirmForm from '../DelegateOutConfirmForm';
const DelegateOutForm = Form.create({ name: 'DelegateOutConfirmForm' })(DelegateOutConfirmForm);
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import intl from 'react-intl-universal';
const wanTx = require('wanchainjs-tx');
import TrezorConnect from 'trezor-connect';
const pu = require('promisefy-util')
import { getNonce, getGasPrice, estimateGas, getChainId, getContractAddr, getContractData} from 'utils/helper';
import { toWei } from 'utils/support.js';

@inject(stores => ({
  getAddrList: stores.wanAddress.getAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class DelegateOut extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    }
  }

  showDialog = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  handleSend = async () => {
    let from = this.props.record.accountAddress;
    const { ledgerAddrList, trezorAddrList } = this.props;

    const WALLET_ID_NATIVE = 0x01;   // Native WAN HD wallet
    const WALLET_ID_LEDGER = 0x02;
    const WALLET_ID_TREZOR = 0x03;

    let walletID = WALLET_ID_NATIVE;

    for (let i = 0; i < ledgerAddrList.length; i++) {
      const hdAddr = ledgerAddrList[i].address;
      if (hdAddr.toLowerCase() == from.toLowerCase()) {
        walletID = WALLET_ID_LEDGER
        break;
      }
    }

    for (let i = 0; i < trezorAddrList.length; i++) {
      const hdAddr = trezorAddrList[i].address;
      if (hdAddr.toLowerCase() == from.toLowerCase()) {
        walletID = WALLET_ID_TREZOR
        break;
      }
    }

    let tx = {
      "from": this.props.record.accountAddress,
      "validator": this.props.record.validator.address,
      "path": this.props.record.accountPath,
      "walletID": walletID,
      "stakeAmount": this.props.record.myStake.title,
    }

    if (walletID == WALLET_ID_TREZOR) {
      await this.trezorDelegateOut(tx.path, tx.from, tx.validator, "0", tx.stakeAmount);
      this.setState({ visible: false });
      return;
    }

    if (walletID == WALLET_ID_LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }

    wand.request('staking_delegateOut', tx, (err, ret) => {
      if (err) {
        message.warn("Estimate gas failed. Please try again");
      } else {
        console.log('delegateOut ret:', ret);
      }
    });

    this.setState({ visible: false });
  }


  trezorDelegateOut = async (path, from, validator, value, stakeAmount) => {
    console.log('trezorDelegateOut:', path, from, validator, value);
    let chainId = await getChainId();
    console.log('chainId', chainId);
    let func = 'delegateOut';
    try {
      console.log('ready to get nonce, gasPrice, data');
      console.log('getNonce');
      let nonce = await getNonce(from, 'wan');
      console.log('getNonce', nonce);
      console.log('getGasPrice');
      let gasPrice = await getGasPrice('wan');
      console.log('getGasPrice', gasPrice);
      console.log('getContractData');
      let data = await getContractData(func, validator);
      console.log('getContractData', data);
      //let [nonce, gasPrice, data] = await Promise.all([getNonce(from, 'wan'), getGasPrice('wan'), getContractData(func, validator)]);
      console.log('nonce, gasPrice, data', nonce, toWei(gasPrice, "gwei"), data);
      let amountWei = toWei(value);
      console.log('amountWei', amountWei);
      const cscContractAddr = await getContractAddr();
      console.log('cscContractAddr', cscContractAddr)
      let rawTx = {};
      rawTx.from = from;
      rawTx.to = cscContractAddr;
      rawTx.value = amountWei;
      rawTx.data = data;
      rawTx.nonce = '0x' + nonce.toString(16);
      rawTx.gasLimit = '0x' + Number(200000).toString(16);
      rawTx.gasPrice = toWei(gasPrice, "gwei");
      rawTx.Txtype = Number(1);
      rawTx.chainId = chainId;

      console.log('rawTx:', rawTx);
      let raw = await pu.promisefy(this.signTrezorTransaction, [path, rawTx], this);
      console.log('signTransaction finish, ready to send.')
      console.log('raw:', raw);

      let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
      console.log('transaction_raw finish, txHash:', txHash);
      let params = {
        srcSCAddrKey: 'WAN',
        srcChainType: 'WAN',
        tokenSymbol: 'WAN',
        hashX: txHash,
        txHash,
        from: from.toLowerCase(),
        validator: validator,
        annotate: 'DelegateIn',
        status: 'Sent',
        source: "external",
        stakeAmount: "stakeAmount",
        ...rawTx
      }

      await pu.promisefy(wand.request, ['staking_insertTransToDB', { rawTx: params }], this);
      console.log('staking_insertTransToDB finish')
      this.props.updateStakeInfo();
      this.props.updateTransHistory();
    } catch (error) {
      message.error(error)
    }
  }

  signTrezorTransaction = (path, tx, callback) => {
    console.log('signTrezorTransaction:', path, tx);
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
        txType: tx.Txtype, // Txtype case is required by wanTx
      },
    }).then((result) => {
      console.log('signTrezorTransaction result:', result);

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
      console.log('signed', signedTx);
      console.log('tx:', tx);
      callback(null, signedTx);
    });
  }

  render() {
    return (
      <div>
        <Button className="modifyExititBtn" onClick={this.showDialog} />
        {this.state.visible
          ? <DelegateOutForm onCancel={this.handleCancel} onSend={this.handleSend}
            record={this.props.record}
            title={intl.get('WithdrawForm.title')}
            note={intl.get('WithdrawForm.note')}
          />
          : ''
        }
      </div>
    );
  }
}

export default DelegateOut