import React, { Component } from 'react';
import { message, Button, Form } from 'antd';

import NormalTransForm from 'components/NormalTransForm'
import './index.less';
import { observer, inject } from 'mobx-react';
import { getNonce, getGasPrice, getGasLimit, getChainId } from 'utils/helper';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  chainId: stores.session.chainId,
  addTransaction: (addr, params) => stores.sendTransParams.addTransaction(addr, params),
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce),
  updateChainId: (addr, nonce) => stores.sendTransParams.updateChainId(addr, nonce),
  updatePath: (addr, path) => stores.sendTransParams.updatePath(addr, path),
}))

@observer
class SendNormalTrans extends Component {
  constructor(props) {
    super(props);
    console.log("from", this.props.from)
    this.chainType = this.props.chainType;
    this.state = {
      loading: false,
      visible: false,
      minGasPrice: 180,
    };

    let params = {
      gasPrice: 200,
      gasLimit: 21000,
      nonce: 0,
      data: '0x',
      chainId: this.props.chainId,
      txType: 1,
      path: '',
      to: '',
      amount: 0
    };
    this.props.addTransaction(this.props.from, params);
  }

  CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

  showModal = async () => {
    console.log("from", this.props.from)
    this.props.updatePath(this.props.from, this.props.path);
    try {
      let [nonce, gasPrice] = await Promise.all([getNonce(this.props.from, this.chainType), getGasPrice(this.chainType)]);
      console.log('nonce', nonce, "gasPrice", gasPrice);
      this.props.updateNonce(this.props.from, nonce);
      this.props.updateGasPrice(this.props.from, gasPrice);
      this.setState({ visible: true });
      console.log('params', this.props.transParams[this.props.from])
    } catch (err) {
      message.warn(err);
    }
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = (formRef) => {
    this.formRef = formRef;
  }

  handleSend = (from) => {
    this.props.handleSend(from);
    this.setState({ visible: false });
  }

  render() {
    const CollectionCreateForm = this.CollectionCreateForm;
    const from = this.props.from;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>Send</Button>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.visible}
          minGasPrice={this.state.minGasPrice}
          maxGasPrice={this.props.transParams[from].gasPrice * 2}
          from={from}
          onCancel={this.handleCancel}
          onSend={this.handleSend} />
      </div>
    );
  }
}

export default SendNormalTrans;