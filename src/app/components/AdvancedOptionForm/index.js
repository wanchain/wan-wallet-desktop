import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber, Icon } from 'antd';

import './index.less';

class AdvancedOptionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.gasPrice,
      gasLimit: this.props.gasLimit
    }
  }

  handleGasPriceChange = (value) => {
    this.setState({ gasPrice: value });
  }

  handleGasLimitChange = (value) => {
    this.setState({ gasLimit: value });
  }

  render() {
    const { visible, onCancel, onSave, form, minGasPrice } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title="Advanced Options"
        onCancel={onCancel}
        onOk={onSave}
        footer={[
          <Button key="submit" type="primary" onClick={() => onSave(this.state.gasPrice, this.state.gasLimit)}>Save</Button>,
          <Button key="back" className="cancel" onClick={onCancel}>Cancel</Button>,
        ]}
      >
        <Form labelCol={{ span: 5 }} wrapperCol={{ span: 12 }} className="transForm">
          <Form.Item label="Gas Price (GWIN)"> {
            getFieldDecorator(
              'gasPrice', { initialValue: this.state.gasPrice },
              { rules: [{ required: true, message: 'Gas price is incorrect' }] })
              (<InputNumber min={minGasPrice} onChange={this.handleGasPriceChange} prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)
          }
          </Form.Item>
          <Form.Item label="Gas Limit">
            {getFieldDecorator(
              'gasLimit', { initialValue: this.state.gasLimit },
              { rules: [{ required: true, message: 'Gas limit is incorrect' }] })
              (<InputNumber onChange={this.handleGasLimitChange} prefix={<Icon type="money-collect" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;



