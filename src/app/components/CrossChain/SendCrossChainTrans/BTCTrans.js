import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';
import { getReadyOpenStoremanGroupListByChainPair, getGasPrice, estimateSmartFee } from 'utils/helper';
import { INBOUND, OUTBOUND, REDEEMWETH_GAS, LOCKWETH_GAS, LOCKETH_GAS } from 'utils/settings';
import CrossBTCForm from 'components/CrossChain/CrossChainTransForm/CrossBTCForm';

const CollectionCreateForm = Form.create({ name: 'CrossBTCForm' })(CrossBTCForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  getAmount: stores.btcAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  addCrossTransTemplate: (addr, params) => stores.sendCrossChainParams.addCrossTransTemplate(addr, params),
  updateBTCTransParams: paramsObj => stores.sendCrossChainParams.updateBTCTransParams(paramsObj),
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
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
    const { from, updateBTCTransParams, updateTransParams, direction, path, currentTokenPairInfo: info, addCrossTransTemplate, chainType } = this.props;
    this.setState(() => ({ visible: true, spin: true, loading: true }));
    if (direction === OUTBOUND) {
      addCrossTransTemplate(from, { chainType, path });
    }
    try {
      let [gasPrice, smgList] = await Promise.all([getGasPrice(info.toChainSymbol), getReadyOpenStoremanGroupListByChainPair()]);
      if (smgList.length === 0) {
        this.setState(() => ({ visible: false, spin: false, loading: false }));
        message.warn(intl.get('SendNormalTrans.smgUnavailable'));
        return;
      }
      let originalFee, destinationFee;
      let smgId = smgList[0].groupId;
      if (direction === INBOUND) {
        originalFee = 0;
        destinationFee = new BigNumber(gasPrice).times(REDEEMWETH_GAS).times(2.5).div(BigNumber(10).pow(9)).toString(10);
        let feeRate = await estimateSmartFee();
        updateBTCTransParams({
          feeRate,
          changeAddress: from,
          storeman: smgId,
          gasPrice,
        });
      } else {
        originalFee = new BigNumber(gasPrice).times(LOCKWETH_GAS).div(BigNumber(10).pow(9)).toString(10)
        destinationFee = 0;
        updateTransParams(from, {
          gasPrice,
          gasLimit: LOCKETH_GAS,
          storeman: smgId,
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

  handleSend = (from) => {
    this.setState({ loading: true });
    this.props.handleSend(from).then(() => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(() => {
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render() {
    const { visible, loading, spin, smgList, estimateFee } = this.state;
    const { from, getAmount, direction, getTokensListInfo } = this.props;
    let balance;
    if (direction === INBOUND) {
      balance = getAmount;
    } else {
      let item = getTokensListInfo.find(item => item.address === from);
      balance = item ? item.amount : '0';
    }
    return (
      <div>
        <Button type="primary" onClick={this.showModal} >{intl.get('Common.convert')}</Button>
        { visible &&
          <CollectionCreateForm from={this.props.from} balance={balance} direction={this.props.direction} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin} />
        }
      </div>
    );
  }
}

export default BTCTrans;
