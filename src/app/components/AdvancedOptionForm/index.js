import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce)
}))

@observer
class AdvancedOptionForm extends Component {
  constructor(props) {
    super(props);
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    let from = this.props.from;
    let gasLimit = this.props.form.getFieldValue('gasLimit');
    let gasPrice = this.props.form.getFieldValue('gasPrice');
    let nonce = this.props.form.getFieldValue('nonce');
    this.props.updateGasLimit(from, gasLimit);
    this.props.updateGasPrice(from, gasPrice);
    this.props.updateNonce(from, nonce);

    this.props.onSave();
  }

  render() {
    const { visible, form, minGasPrice, from } = this.props;
    const { getFieldDecorator } = form;
    const { gasLimit, gasPrice, nonce } = this.props.transParams[from];
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title="Advanced Options"
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="submit" type="primary" onClick={() => this.handleSave()}>Save</Button>,
          <Button key="back" className="cancel" onClick={this.handleCancel}>Cancel</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label="Gas Price (GWIN)"> {
            getFieldDecorator(
              'gasPrice', { initialValue: gasPrice },
              { rules: [{ required: true, message: 'Gas price is incorrect' }] })
              (<InputNumber min={minGasPrice} />)
          }
          </Form.Item>
          <Form.Item label="Gas Limit">
            {getFieldDecorator(
              'gasLimit', { initialValue: gasLimit },
              { rules: [{ required: true, message: 'Gas limit is incorrect' }] })
              (<InputNumber />)}
          </Form.Item>
          <Form.Item label="Nonce">
            {getFieldDecorator(
              'nonce', { initialValue: nonce },
              { rules: [{ required: true, message: 'Nonce is incorrect' }] })
              (<InputNumber />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;



