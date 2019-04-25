import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber, Icon } from 'antd';

import './index.less';

class AdvancedOptionForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gasPrice: this.props.gasPrice,
      gasLimit: this.props.gasLimit,
      nonce: this.props.nonce
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.gasPrice !== this.props.gasPrice) {
      this.setState({
        gasPrice: nextProps.gasPrice
      });
    }
    if (nextProps.gasLimit !== this.props.gasLimit) {
      this.setState({
        gasLimit: nextProps.gasLimit
      });
    }
    if (nextProps.nonce !== this.props.nonce) {
      this.setState({
        nonce: nextProps.nonce
      });
    }
  }

  handleGasPriceChange = (value) => {
    this.setState({ gasPrice: value });
  }

  handleGasLimitChange = (value) => {
    this.setState({ gasLimit: value });
  }

  handleNonceChange = (value) => {
    this.setState({ nonce: value });
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
          <Button key="submit" type="primary" onClick={() => onSave(this.state.gasPrice, this.state.gasLimit, this.state.nonce)}>Save</Button>,
          <Button key="back" className="cancel" onClick={onCancel}>Cancel</Button>,
        ]}
      >
        <Form labelCol={{ span: 5 }} wrapperCol={{ span: 12 }} className="transForm">
          <Form.Item label="Gas Price (GWIN)"> {
            getFieldDecorator(
              'gasPrice', { initialValue: this.state.gasPrice },
              { rules: [{ required: true, message: 'Gas price is incorrect' }] })
              (<InputNumber min={minGasPrice} onChange={this.handleGasPriceChange} />)
          }
          </Form.Item>
          <Form.Item label="Gas Limit">
            {getFieldDecorator(
              'gasLimit', { initialValue: this.state.gasLimit },
              { rules: [{ required: true, message: 'Gas limit is incorrect' }] })
              (<InputNumber onChange={this.handleGasLimitChange} />)}
          </Form.Item>
          <Form.Item label="Nonce">
            {getFieldDecorator(
              'nonce', { initialValue: this.state.nonce },
              { rules: [{ required: true, message: 'Nonce is incorrect' }] })
              (<InputNumber onChange={this.handleNonceChange} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;



