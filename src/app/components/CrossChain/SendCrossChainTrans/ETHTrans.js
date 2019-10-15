import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { INBOUND, LOCKETH_GAS, REDEEMWETH_GAS } from 'utils/settings';
import CrossETHForm from 'components/CrossChain/CrossChainTransForm/CrossETHForm'
import { getGasPrice, getBalanceByAddr, getSmgList } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'CrossETHForm' })(CrossETHForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  updateGasPrice: (gasPrice, chainType) => stores.sendCrossChainParams.updateGasPrice(gasPrice, chainType),
  addCrossTransTemplate: (addr, params) => stores.sendCrossChainParams.addCrossTransTemplate(addr, params),
}))

@observer
class ETHTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
    smgList: [],
    estimateFee: {
      original: 0,
      destination: 0
    }
  }

  showModal = async () => {
    const { from, path, addrInfo, getTokensListInfo, chainType, addCrossTransTemplate, updateTransParams, updateGasPrice, type } = this.props;
    let desChain;
    if (type === INBOUND) {
      desChain = 'WAN';
      if (getBalanceByAddr(from, addrInfo) === '0') {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    } else {
      desChain = 'ETH';
      if ((getTokensListInfo.filter(item => item.address === from)[0]).amount === 0) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    }

    addCrossTransTemplate(from, { chainType, path });
    this.setState({ visible: true });
    try {
      let [gasPrice, desGasPrice, smgList] = await Promise.all([getGasPrice(chainType), getGasPrice(desChain), getSmgList(chainType)]);
      this.setState({
        smgList,
        estimateFee: {
          original: new BigNumber(gasPrice).times(LOCKETH_GAS).div(BigNumber(10).pow(9)).toString(10),
          destination: new BigNumber(desGasPrice).times(REDEEMWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
      } });
      updateTransParams(from, { gasPrice, gasLimit: LOCKETH_GAS, storeman: smgList[0][chainType === 'ETH' ? 'ethAddress' : 'wanAddress'], txFeeRatio: smgList[0].txFeeRatio });
      setTimeout(() => { this.setState({ spin: false }) }, 0)
    } catch (err) {
      console.log('showModal:', err)
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
    this.props.handleSend(from).then(() => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(() => {
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin, smgList, estimateFee } = this.state;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('SendNormalTrans.send')}</Button>
        { visible &&
          <CollectionCreateForm chainType={this.props.chainType} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default ETHTrans;
