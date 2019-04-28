import React, { Component } from 'react';
import { message, Button, Form } from 'antd';

import NormalTransForm from 'components/NormalTransForm'
import './index.less';
import { observer, inject } from 'mobx-react';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  addTransaction: (addr, params) => stores.sendTransParams.addTransaction(addr, params),
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce),
  updatePath: (addr, path) => stores.sendTransParams.updatePath(addr, path),
}))

@observer
class SendNormalTrans extends Component {
  constructor(props) {
    super(props);
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
      chainId: 3,  /** TODO */
      txType: 1,
      path: '',
      to: '',
      amount: 0
    };
    this.props.addTransaction(this.props.from, params);
  }

  CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

  showModal = () => {
    this.props.updatePath(this.props.from, this.props.path);
    wand.request('address_getNonce', { addr: this.props.from, chainType: 'WAN' }, (err, val) => {
      if (err) {
        message.warn(err);
      } else {
        let nonce = parseInt(val, 16);
        this.props.updateNonce(this.props.from, nonce);
        this.setState({ visible: true });
      }
    });
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