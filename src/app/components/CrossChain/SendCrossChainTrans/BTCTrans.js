import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';
import { getSmgList, getGasPrice, estimateSmartFee } from 'utils/helper';
import { INBOUND, REDEEMWETH_GAS, LOCKWETH_GAS } from 'utils/settings';
import CrossBTCForm from 'components/CrossChain/CrossChainTransForm/CrossBTCForm';

const CollectionCreateForm = Form.create({ name: 'CrossBTCForm' })(CrossBTCForm);
const GASLIMIT = 300000;

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.btcAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.btcAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
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
    const { from, getTokensListInfo, updateBTCTransParams, direction, getAmount, path, currentTokenPairInfo } = this.props;
    let info = Object.assign({}, currentTokenPairInfo);
    /* if (direction === INBOUND) {
      if (getAmount === 0) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    } else {
      if (new BigNumber((getTokensListInfo.find(item => item.address === from)).amount).isEqualTo(0)) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
    } */

    this.setState(() => ({ visible: true, spin: true, loading: true }));
    try {
      let [gasPrice, smgList, { feerate: feeRate }] = await Promise.all([getGasPrice(info.toChainSymbol), getSmgList(info.fromChainSymbol), estimateSmartFee()]);
      let originalFee, destinationFee;
      let smg = smgList[0];

      if (direction === INBOUND) {
        originalFee = 0;
        destinationFee = new BigNumber(gasPrice).times(REDEEMWETH_GAS).times(2.5).div(BigNumber(10).pow(9)).toString(10);
        updateBTCTransParams({
          feeRate,
          btcAddress: smg.btcAddress,
          changeAddress: from,
          storeman: smg.wanAddress,
          smgBtcAddr: smg.smgBtcAddr,
          gasPrice: gasPrice,
          gas: GASLIMIT
        });
      } else {
        originalFee = new BigNumber(gasPrice).times(LOCKWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
        destinationFee = 0;
        updateBTCTransParams({
          feeRate,
          from: {
            walletID: 1,
            path
          },
          txFeeRatio: smg.txFeeRatio,
          storeman: smg.wanAddress,
          gasPrice: gasPrice,
          gas: GASLIMIT
        });
      }

      this.setState({
        smgList,
        estimateFee: {
          original: originalFee,
          destination: destinationFee
        },
        spin: false,
        loading: false,
      });
    } catch (err) {
      console.log('showModal:', err);
      this.setState(() => ({ visible: false, spin: false, loading: false }));
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
      btnStyle = {};
      balance = getAmount;
    } else {
      btnStyle = {};
      let item = getTokensListInfo.find(item => item.address === from);
      balance = item ? item.amount : '0';
    }
    return (
      <div>
        <Button type="primary" {...btnStyle} onClick={this.showModal} /* disabled={Number(balance) === 0} */>{intl.get('Common.convert')}</Button>
        { visible &&
          <CollectionCreateForm from={this.props.from} balance={balance} direction={this.props.direction} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default BTCTrans;
