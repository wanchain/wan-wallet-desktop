import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  minGasPrice: stores.sendTransParams.minGasPrice,
  transParams: stores.sendTransParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class AdvancedOptionForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    let from = this.props.from;
    let gasLimit = this.props.form.getFieldValue('gasLimit');
    let gasPrice = this.props.form.getFieldValue('gasPrice');
    let nonce = this.props.form.getFieldValue('nonce');
    this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
    console.log("handleSave", this.props.transParams[from])
    this.props.onSave();
  }

  render() {
    const { visible, form, minGasPrice, from, transParams } = this.props;
    const { getFieldDecorator } = form;
    const { gasLimit, gasPrice, nonce } = transParams[from];
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title="Advanced Options"
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>Cancel</Button>,
          <Button key="submit" type="primary" className="confirm-button" onClick={this.handleSave}>Save</Button>,
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
              (<InputNumber min={21000} />)}
          </Form.Item>
          <Form.Item label="Nonce">
            {getFieldDecorator(
              'nonce', { initialValue: nonce },
              { rules: [{ required: true, message: 'Nonce is incorrect' }] })
              (<InputNumber min={0} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;



