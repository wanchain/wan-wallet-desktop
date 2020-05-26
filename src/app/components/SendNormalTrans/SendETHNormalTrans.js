import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import { TRANSTYPE } from 'utils/settings';
import { getNonce, getGasPrice, getBalanceByAddr } from 'utils/helper';
import ETHNormalTransForm from 'components/NormalTransForm/ETHNormalTrans/ETHNormalTransForm'

const CollectionCreateForm = Form.create({ name: 'ETHNormalTransForm' })(ETHNormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.transParams,
  E20TokensBalance: stores.tokens.E20TokensBalance,
  addTransTemplate: (addr, params) => stores.sendTransParams.addTransTemplate(addr, params),
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
  updateGasPrice: (gasPrice, chainType) => stores.sendTransParams.updateGasPrice(gasPrice, chainType),
}))

@observer
class SendETHNormalTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
  }

  showModal = async () => {
    const { from, addrInfo, path, chainType, chainId, addTransTemplate, updateTransParams, updateGasPrice, transType, E20TokensBalance, tokenAddr } = this.props;
    if (getBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('SendNormalTrans.hasNoETHBalance'));
      return;
    }
    if (transType === TRANSTYPE.tokenTransfer) {
      if (!E20TokensBalance[tokenAddr] || E20TokensBalance[tokenAddr][from] === '0') {
        message.warn(intl.get('SendNormalTrans.hasNoTokenBalance'));
        return;
      }
    }
    this.setState({ visible: true });
    addTransTemplate(from, { chainType, chainId });
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateTransParams(from, { path, nonce, gasPrice });
      updateGasPrice(gasPrice, chainType);
      setTimeout(() => { this.setState({ spin: false }) }, 0)
    } catch (err) {
      console.log(`showModal: ${err}`)
      message.warn(intl.get('network.down'));
    }
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = from => {
    this.setState({ loading: true });
    this.props.handleSend(from).then(ret => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(err => {
      console.log(err);
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin } = this.state;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm tokenAddr={this.props.tokenAddr} transType={this.props.transType} balance={this.props.balance} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default SendETHNormalTrans;
