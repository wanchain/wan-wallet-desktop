import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import wanUtil, { toChecksumOTAddress } from 'wanchain-util';

import { TRANSTYPE, WALLETID } from 'utils/settings';
import NormalTransForm from 'components/NormalTransForm';
import WRC20NormalTransForm from 'components/NormalTransForm/WRC20NormalTransForm';
import { getNonce, getGasPrice, getBalanceByAddr, checkAddrType } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);
const WRC20CollectionCreateForm = Form.create({ name: 'WRC20NormalTransForm' })(WRC20NormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  tokensBalance: stores.tokens.tokensBalance,
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
    const { from, addrInfo, path, chainType, chainId, addTransTemplate, updateTransParams, updateGasPrice, transType, tokenAddr, tokensBalance } = this.props;

    // No sufficient funds
    if (getBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    if (transType === TRANSTYPE.tokenTransfer) {
      if (!tokensBalance[tokenAddr] || tokensBalance[tokenAddr][from] === '0') {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    }
    this.setState({ visible: true });
    addTransTemplate(from, { chainType, chainId });
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateTransParams(from, { path, nonce, gasPrice });
      updateGasPrice(gasPrice);
      setTimeout(() => { this.setState({ spin: false }) }, 0)
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

  onSendNormalTransaction = (from) => {
    const { chainType } = this.props;
    let params = this.props.transParams[from];
    let walletID = checkAddrType(from, this.props.addrInfo) === 'normal' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
    let trans = {
      walletID: walletID,
      chainType: chainType,
      path: params.path,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      to: params.to,
      amount: params.amount,
      symbol: chainType,
      nonce: params.nonce,
      data: params.data,
    };
    this.setState({ loading: true });
    wand.request('transaction_normal', trans, (err, txHash) => {
      if (err) {
        message.warn(intl.get('WanAccount.sendTransactionFailed'));
        console.log('Send transaction failed:', err);
      } else {
        this.props.updateTransHistory();
        console.log('Tx hash: ', txHash);
      }
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  onSendPrivateTransaction = (from, splitAmount = []) => {
    const { chainType } = this.props;
    let params = this.props.transParams[from];
    let walletID = checkAddrType(from, this.props.addrInfo) === 'normal' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
    let trans = {
      walletID: walletID,
      chainType: chainType,
      path: params.path,
      gasLimit: `0x${params.gasLimit.toString(16)}`,
      gasPrice: params.gasPrice,
      to: toChecksumOTAddress(params.to),
      amount: splitAmount,
    };
    this.setState({ loading: true });
    wand.request('transaction_private', trans, (err, txHash) => {
      if (err) {
        message.warn(intl.get('WanAccount.sendBatchTransactionFailed'));
        console.log('Send transaction failed:', err);
      } else {
        message.success(intl.get('WanAccount.sendTransactionSuccessFully'));
        this.props.updateTransHistory();
      }
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render() {
    const { visible, loading, spin } = this.state;
    const { tokenAddr, transType, balance } = this.props;

    return (
      <div>
        <Button type="primary" className={this.props.buttonClassName ? this.props.buttonClassName : ''} onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible && !tokenAddr && <CollectionCreateForm balance={balance} tokenAddr={tokenAddr} transType={transType} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin} disablePrivateTx={this.props.disablePrivateTx}/> }
        { visible && tokenAddr && <WRC20CollectionCreateForm balance={balance} tokenAddr={tokenAddr} transType={transType} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin} disablePrivateTx={this.props.disablePrivateTx}/> }
      </div>
    );
  }
}

export default SendNormalTrans;
