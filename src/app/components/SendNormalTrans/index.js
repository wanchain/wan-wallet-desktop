import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import wanUtil from 'wanchain-util';

import './index.less';
import NormalTransForm from 'components/NormalTransForm'
import { getNonce, getGasPrice, getBalanceByAddr, checkAddrType } from 'utils/helper';
import { WALLETID } from 'utils/settings';

const CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  addTransTemplate: (addr, params) => stores.sendTransParams.addTransTemplate(addr, params),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
  updateGasPrice: (gasPrice) => stores.sendTransParams.updateGasPrice(gasPrice),
}))

@observer
class SendNormalTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
  }

  showModal = async () => {
    const { from, addrInfo, path, chainType, chainId, addTransTemplate, updateTransParams, updateGasPrice } = this.props;

    if (getBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    this.setState({ visible: true });
    addTransTemplate(from, { chainType, chainId });
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateTransParams(from, { path, nonce, gasPrice });
      updateGasPrice(gasPrice);
      this.setState({ spin: false });
    } catch (err) {
      console.log(`Get nonce or gas price failed: ${err}`)
      message.warn(err);
    }
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  onSend = (from, splitAmount = []) => {
    const { chainType } = this.props;
    let params = this.props.transParams[from];
    let walletID = checkAddrType(from, this.props.addrInfo) === 'normal' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
    let trans = {
      walletID: walletID,
      chainType: chainType,
      path: params.path,
      to: params.to,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
    };
    this.setState({ loading: true });
    console.log('splitAmount:', splitAmount);

    // Private tx
    if (wanUtil.isValidChecksumOTAddress(trans.to)) {
      trans.amount = splitAmount;
      wand.request('transaction_private', trans, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log('Send transaction failed:', err);
        } else {
          message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
          this.props.updateTransHistory();
          this.setState({ visible: false, loading: false, spin: true });
        }
      });
    } else { // normal tx
      trans.amount = params.amount;
      trans.symbol = chainType;
      trans.nonce = params.nonce;
      trans.data = params.data;
      wand.request('transaction_normal', trans, (err, txHash) => {
        if (err) {
          message.warn(intl.get('WanAccount.sendTransactionFailed'));
          console.log('Send transaction failed:', err);
        } else {
          this.props.updateTransHistory();
          console.log('Tx hash: ', txHash);
          this.setState({ visible: false, loading: false, spin: true });
        }
      });
    }
  }

  render() {
    const { visible, loading, spin } = this.state;
    return (
      <div>
        <Button type="primary" className={this.props.buttonClassName ? this.props.buttonClassName : ''} onClick={this.showModal}>{intl.get('Common.send')}</Button>
        {visible && <CollectionCreateForm wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.onSend} loading={loading} spin={spin} disablePrivateTx={this.props.disablePrivateTx} />}
      </div>
    );
  }
}

export default SendNormalTrans;
