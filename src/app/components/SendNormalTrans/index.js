import React, { Component } from 'react';
import { Modal, Button, Form } from 'antd';

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
    }
  }
  CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

  showModal = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = (formRef) => {
    this.formRef = formRef;
  }

  handleSend = (params) => {
    console.log("send normal", params)
    this.setState({ visible: false });

  }

  render() {
    const CollectionCreateForm = this.CollectionCreateForm;
    const from = this.props.from;
    
    let gasLimit = 300000;
    let gasPrice = this.state.gasPrice;

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
        from={from}
        onCancel={this.handleCancel}
        onSend={this.handleSend}/>
      </div>
    );
  }
}

export default SendNormalTrans;