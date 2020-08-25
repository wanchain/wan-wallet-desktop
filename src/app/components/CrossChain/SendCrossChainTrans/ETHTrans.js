import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { getGasPrice, getBalanceByAddr, getSmgList, getStoremanGroupListByChainPair } from 'utils/helper';
import CrossETHForm from 'components/CrossChain/CrossChainTransForm/CrossETHForm';
import { INBOUND, LOCKETH_GAS, REDEEMWETH_GAS, LOCKWETH_GAS, REDEEMETH_GAS } from 'utils/settings';

const CollectionCreateForm = Form.create({ name: 'CrossETHForm' })(CrossETHForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getE20TokensListInfo: stores.tokens.getE20TokensListInfo,
  tokenPairs: stores.crossChain.tokenPairs,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
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
      destination: 0,
    }
  }

  showModal = async () => {
    const { from, path, addrInfo, getTokensListInfo, getE20TokensListInfo, chainType, addCrossTransTemplate, updateTransParams, type, tokenAddr, tokenPairs, chainPairId } = this.props;
    let desChain, origGas, destGas, smgParams, storeman;
    smgParams = tokenAddr || 'ETH';
    let info = Object.assign({}, tokenPairs[chainPairId]);
    if (type === INBOUND) {
      if (getBalanceByAddr(from, addrInfo) === '0') {
        message.warn(intl.get('SendNormalTrans.hasNoWANBalance'));
        return;
      }

      if (this.props.tokenAddr && (new BigNumber(getE20TokensListInfo.find(item => item.address === from).amount)).isEqualTo(0)) {
        message.warn(intl.get('SendNormalTrans.hasNoTokenBalance'));
        return;
      }

      desChain = 'WAN';
      origGas = LOCKETH_GAS;
      destGas = REDEEMWETH_GAS;
    } else {
      if (new BigNumber((getTokensListInfo.find(item => item.address === from)).amount).isEqualTo(0)) {
        message.warn(intl.get('SendNormalTrans.hasNoTokenBalance'));
        return;
      }

      desChain = 'ETH';
      origGas = LOCKWETH_GAS;
      destGas = REDEEMETH_GAS;
    }

    addCrossTransTemplate(from, { chainType, path });
    try {
      let [gasPrice, desGasPrice, smgList] = await Promise.all([getGasPrice(chainType), getGasPrice(desChain), getStoremanGroupListByChainPair(info.fromChainID, info.toChainID)]);
      this.setState({
        smgList,
        estimateFee: {
          original: new BigNumber(gasPrice).times(origGas).div(BigNumber(10).pow(9)).toString(10),
          destination: new BigNumber(desGasPrice).times(destGas).div(BigNumber(10).pow(9)).toString(10)
        }
      });
      storeman = smgList[0].groupId;
      updateTransParams(from, { gasPrice, gasLimit: origGas, storeman, txFeeRatio: smgList[0].txFeeRatio || 0 });
      this.setState({ visible: true, spin: false })
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

  render() {
    const { visible, loading, spin, smgList, estimateFee } = this.state;
    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('Common.convert')}</Button>
        {visible &&
          <CollectionCreateForm balance={this.props.balance} decimals={this.props.decimals} tokenAddr={this.props.tokenAddr} symbol={this.props.symbol} chainType={this.props.chainType} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin} />
        }
      </div>
    );
  }
}

export default ETHTrans;
