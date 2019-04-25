import React, { Component } from 'react';
import { message, Button, Form } from 'antd';

import NormalTransForm from 'components/NormalTransForm'
import './index.less';

class SendNormalTrans extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      visible: false,
      minGasPrice: 180,
      gasPrice: 200,
      gasLimit: 21000,
      nonce: 0
    }
  }
  CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

  showModal = () => {
    wand.request('address_getNonce', { addr: this.props.from, chainType: 'WAN' }, (err, val) => {
      if (err) {
        message.warn(err);
      } else {
        this.setState({nonce: val});
      }
    });
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = (formRef) => {
    this.formRef = formRef;
  }

  handleSend = (params) => {
    this.props.handleSend(params);
    this.setState({ visible: false });
  }

  render() {
    const CollectionCreateForm = this.CollectionCreateForm;
    const from = this.props.from;

    let gasLimit = this.state.gasLimit;
    let gasPrice = this.state.gasPrice;
    let nonce = this.state.nonce;

    return (
      <div>
        <Button type="primary" onClick={this.showModal}>Send</Button>
        <CollectionCreateForm
          wrappedComponentRef={this.saveFormRef}
          visible={this.state.visible}
          minGasPrice={this.state.minGasPrice}
          maxGasPrice={gasPrice * 2}
          gasPrice={gasPrice}
          gasLimit={gasLimit}
          nonce={nonce}
          from={from}
          path={this.props.path}
          onCancel={this.handleCancel}
          onSend={this.handleSend} />
      </div>
    );
  }
}

export default SendNormalTrans;