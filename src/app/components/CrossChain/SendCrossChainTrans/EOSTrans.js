import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { message, Button, Form } from 'antd';

import { getGasPrice, getSmgList } from 'utils/helper';
import CrossEOSForm from 'components/CrossChain/CrossChainTransForm/CrossEOSForm';
import { INBOUND, REDEEMWEOS_GAS, LOCKWEOS_GAS } from 'utils/settings';

const CollectionCreateForm = Form.create({ name: 'CrossEOSForm' })(CrossEOSForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
  addCrossTransTemplate: (addr, params) => stores.sendCrossChainParams.addCrossTransTemplate(addr, params),
}))

@observer
class EOSTrans extends Component {
  state = {
    spin: true,
    loading: false,
    visible: false,
    smgList: [],
    estimateFee: 0
  }

  showModal = async () => {
    const { from, record, getTokensListInfo, addCrossTransTemplate, updateTransParams, direction, tokenOrigAddr } = this.props;
    let wanGas, storeman;

    if (direction === INBOUND) {
      if (![record.balance, record.ramAvailable, record.cpuAvailable, record.netTotal].every(item => new BigNumber(item).gt(0))) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
      wanGas = REDEEMWEOS_GAS;
    } else {
      if (new BigNumber((getTokensListInfo.find(item => item.address === from)).amount).isEqualTo(0)) {
        message.warn(intl.get('SendNormalTrans.hasBalance'));
        return;
      }
      wanGas = LOCKWEOS_GAS;
    }
    addCrossTransTemplate(from, { path: record.path });
    this.setState({ visible: true });
    try {
      let [gasPrice, smgList] = await Promise.all([getGasPrice('WAN'), getSmgList('EOS', tokenOrigAddr)]);
      this.setState({
        smgList,
        estimateFee: new BigNumber(gasPrice).times(wanGas).div(BigNumber(10).pow(9)).toString(10)
      });
      storeman = smgList[0].storemanGroup;
      updateTransParams(from, { storeman, gasPrice, gasLimit: wanGas, txFeeRatio: smgList[0].txFeeRatio });
      setTimeout(() => { this.setState({ spin: false }) }, 0);
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
    const { symbol, decimals, direction, record } = this.props;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('Common.send')}</Button>
        { visible &&
          <CollectionCreateForm symbol={symbol} balance={direction === INBOUND ? record.balance : record.amount} decimals={decimals} direction={direction} estimateFee={estimateFee} smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default EOSTrans;
