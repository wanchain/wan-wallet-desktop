import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { INBOUND } from 'utils/settings';
import CrossETHForm from 'components/CrossChain/CrossChainTransForm/CrossETHForm'
import { getGasPrice, getBalanceByAddr, getSmgList, estimateCrossETHInboundGas, estimateCrossETHOutboundGas } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'CrossETHForm' })(CrossETHForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  wanAddrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
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
    const { from, path, chainType, addCrossTransTemplate, updateTransParams, updateGasPrice, type } = this.props;
    let desChain, addrInfo, estimateCrossETHGas;
    if (type === INBOUND) {
      desChain = 'WAN';
      estimateCrossETHGas = estimateCrossETHInboundGas;
      addrInfo = this.props.addrInfo;
    } else {
      desChain = 'ETH';
      addrInfo = this.props.wanAddrInfo;
      estimateCrossETHGas = estimateCrossETHOutboundGas;
    }
    if (getBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    addCrossTransTemplate(from, { chainType, path });
    this.setState({ visible: true });
    try {
      let [gasPrice, desGasPrice, smgList, gasResult] = await Promise.all([getGasPrice(chainType), getGasPrice(desChain), getSmgList(chainType), estimateCrossETHGas(from)]);
      this.setState({
        smgList,
        estimateFee: {
          original: new BigNumber(gasPrice).times(gasResult[chainType]).div(BigNumber(10).pow(9)).toString(10),
          destination: new BigNumber(desGasPrice).times(gasResult[desChain]).div(BigNumber(10).pow(9)).toString(10)
      } });
      updateTransParams(from, { gasPrice });
      updateGasPrice(gasPrice, chainType === 'ETH' ? undefined : 'WAN');
      setTimeout(() => { this.setState({ spin: false }) }, 0)
    } catch (err) {
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
    }).catch(err => {
      console.log(err);
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin, smgList, estimateFee } = this.state;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('SendNormalTrans.send')}</Button>
        { visible &&
          <CollectionCreateForm estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default ETHTrans;
