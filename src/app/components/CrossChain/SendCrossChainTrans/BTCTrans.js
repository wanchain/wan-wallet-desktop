import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { getSmgList, getGasPrice } from 'utils/helper';
import { INBOUND, REDEEMWETH_GAS, LOCKWETH_GAS } from 'utils/settings';
import CrossBTCForm from 'components/CrossChain/CrossChainTransForm/CrossBTCForm';

const CollectionCreateForm = Form.create({ name: 'CrossBTCForm' })(CrossBTCForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.btcAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj)
}))

@observer
class BTCTrans extends Component {
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
    const { from, getTokensListInfo, updateBTCTransParams, type, getAmount } = this.props;
    let desChain, origGas, destGas;

    if (type === INBOUND) {
      if (getAmount === 0) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    } else {
      if ((getTokensListInfo.find(item => item.address === from)).amount === 0) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    }

    this.setState({ visible: true });
    try {
      let [wanGasPrice, smgList] = await Promise.all([getGasPrice('WAN'), getSmgList('BTC')]);
      let originalFee, destinationFee;
      if (type === INBOUND) {
        originalFee = 0;
        destinationFee = new BigNumber(wanGasPrice).times(REDEEMWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
      } else {
        originalFee = new BigNumber(wanGasPrice).times(LOCKWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
        destinationFee = 0;
      }
      this.setState({
        smgList,
        estimateFee: {
          original: originalFee,
          destination: destinationFee
        }
      });
      updateBTCTransParams({ changeAddress: from, storeman: smgList[0][type === INBOUND ? 'btcAddress' : 'wanAddress'], feeRate: smgList[0].txFeeRatio });
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
        <Button className="creatBtn" type="primary" shape="round" size="large" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm symbol={this.props.symbol} chainType={this.props.chainType} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default BTCTrans;
