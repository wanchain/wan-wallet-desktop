import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { getSmgList, getGasPrice } from 'utils/helper';
import { INBOUND, REDEEMWETH_GAS, LOCKWETH_GAS } from 'utils/settings';
import CrossBTCForm from 'components/CrossChain/CrossChainTransForm/CrossBTCForm';

const CollectionCreateForm = Form.create({ name: 'CrossBTCForm' })(CrossBTCForm);
const GASLIMIT = 300000;

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.btcAddress.getNormalAmount,
  feeRate: stores.sendCrossChainParams.feeRate,
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
    const { from, getTokensListInfo, updateBTCTransParams, direction, getAmount, feeRate, path } = this.props;

    if (direction === INBOUND) {
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
      let smg = smgList[0];

      if (direction === INBOUND) {
        originalFee = 0;
        destinationFee = new BigNumber(wanGasPrice).times(REDEEMWETH_GAS).times(2.5).div(BigNumber(10).pow(9)).toString(10);
        updateBTCTransParams({
          feeRate,
          btcAddress: smg.btcAddress,
          changeAddress: from,
          storeman: smg.wanAddress,
          smgBtcAddr: smg.smgBtcAddr,
          gasPrice: wanGasPrice,
          gas: GASLIMIT
        });
      } else {
        originalFee = new BigNumber(wanGasPrice).times(LOCKWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
        destinationFee = 0;
        updateBTCTransParams({
          from: {
            walletID: 1,
            path
          },
          txFeeRatio: smg.txFeeRatio,
          storeman: smg.wanAddress,
          gasPrice: wanGasPrice,
          gas: GASLIMIT
        });
      }

      this.setState({
        smgList,
        estimateFee: {
          original: originalFee,
          destination: destinationFee
        }
      });

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

  handleSend = () => {
    this.setState({ loading: true });
    this.props.handleSend().then(() => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(() => {
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin, smgList, estimateFee } = this.state;
    const { from, getAmount, direction, getTokensListInfo } = this.props;
    let balance, btnStyle;

    if (direction === INBOUND) {
      btnStyle = { className: 'createBtn', shape: 'round', size: 'large' };
      balance = getAmount;
    } else {
      btnStyle = {};
      balance = (getTokensListInfo.find(item => item.address === from)).amount;
    }

    return (
      <div>
        <Button type="primary" {...btnStyle} onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm from={this.props.from} balance={balance} direction={this.props.direction} symbol={this.props.symbol} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default BTCTrans;
