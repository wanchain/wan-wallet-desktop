import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';
import NormalTransForm from 'components/NormalTransForm'
import { getNonce, getGasPrice, estimateGas, getChainId } from 'utils/helper';

const CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

@inject(stores => ({
  chainId: stores.session.chainId,
  transParams: stores.sendTransParams.transParams,
  updatePath: (addr, path) => stores.sendTransParams.updatePath(addr, path),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce),
  updateChainId: (addr, nonce) => stores.sendTransParams.updateChainId(addr, nonce),
  addTransaction: (addr, params) => stores.sendTransParams.addTransaction(addr, params),
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
}))

@observer
class SendNormalTrans extends Component {
  state = {
    loading: false,
    visible: false,
    minGasPrice: 180,
  }

  componentWillMount() {
    const { from, chainId, addTransaction } = this.props;

    addTransaction(from, {
      gasPrice: 200,
      gasLimit: 21000,
      nonce: 0,
      data: '0x',
      chainId: chainId,
      txType: 1,
      path: '',
      to: '',
      amount: 0
    });
  }

  showModal = async () => {
    const {from, path, chainType, updatePath, updateNonce, updateGasPrice} = this.props;
    updatePath(from, path);
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(from, chainType), getGasPrice(chainType)]);
      updateNonce(from, nonce);
      updateGasPrice(from, gasPrice);
      this.setState({ visible: true });
    } catch (err) {
      message.warn(err);
    }
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  handleSend = from => {
    this.props.handleSend(from);
    this.setState({ visible: false });
  }

  render() {
    const { from, transParams } = this.props;
    const { visible, minGasPrice } = this.state;
    return (
      <div>
        <Button type="primary" onClick={this.showModal}>Send</Button>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={visible}
          minGasPrice={minGasPrice}
          maxGasPrice={transParams[from].gasPrice * 2}
          from={from}
          onCancel={this.handleCancel}
          onSend={this.handleSend} />
      </div>
    );
  }
}

export default SendNormalTrans;