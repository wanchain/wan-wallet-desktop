import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import ETHTransForm from 'components/CrossChain/CrossChainTransForm/ETHTransForm'
import { getNonce, getGasPrice, getBalanceByAddr, getSmgList } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'ETHTransForm' })(ETHTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  addrInfo: stores.ethAddress.addrInfo,
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
  }

  showModal = async () => {
    const { from, addrInfo, path, chainType, addTransTemplate, updateTransParams, updateGasPrice } = this.props;
    if (getBalanceByAddr(from, addrInfo) === '0') {
      message.warn(intl.get('SendNormalTrans.hasBalance'));
      return;
    }

    this.setState({ visible: true });
    addTransTemplate(from, { chainType, path });
    try {
      let [gasPrice, smgList] = await Promise.all([getGasPrice(chainType), getSmgList(chainType)]);
      this.setState({ smgList });
      updateTransParams(from, { gasPrice });
      updateGasPrice(gasPrice);
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
    this.props.handleSend(from).then(() => {
      this.setState({ visible: false, loading: false, spin: true });
    }).catch(err => {
      console.log(err);
      this.setState({ visible: false, loading: false, spin: true });
    });
  }

  render () {
    const { visible, loading, spin, smgList } = this.state;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>{intl.get('SendNormalTrans.send')}</Button>
        { visible &&
          <CollectionCreateForm smgList={smgList} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} onSend={this.handleSend} loading={loading} spin={spin}/>
        }
      </div>
    );
  }
}

export default ETHTrans;
