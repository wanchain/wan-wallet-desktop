import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber } from 'antd';
import { checkWanAddr, estimateGas } from 'utils/helper';

import AdvancedOptionForm from 'components/AdvancedOptionForm';

import './index.less';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateGasPrice: (addr, gasPrice) => stores.sendTransParams.updateGasPrice(addr, gasPrice),
  updateGasLimit: (addr, gasLimit) => stores.sendTransParams.updateGasLimit(addr, gasLimit),
  updateNonce: (addr, nonce) => stores.sendTransParams.updateNonce(addr, nonce),
  updateTo: (addr, to) => stores.sendTransParams.updateTo(addr, to),
  updateAmount: (addr, amount) => stores.sendTransParams.updateAmount(addr, amount),
}))

@observer
class NormalTransForm extends Component {
  componentWillMount() {
    this.resetState();
    this.averageGasPrice = Math.max(this.props.minGasPrice, this.props.transParams[this.props.from].gasPrice);
    this.minGasPrice = this.props.minGasPrice;
    this.maxGasPrice = this.props.maxGasPrice;
    this.advancedOptionForm = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
  }

  resetState = () => {
    this.setState({
      visible: this.props.visible,
      advancedVisible: false,
      advanced: false
    });
  }

  onAdvanced = () => {
    this.setState({
      advancedVisible: true,
    });
  }

  handleCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  onCancel = () => {
    this.setState({
      advanced: false
    });
    this.props.onCancel();
  }

  handleSave = () => {
    this.setState({
      advancedVisible: false,
      advanced: true
    });
  }

  handleSend = () => {
    let form = this.props.form;
    let from = this.props.from;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      this.props.updateTo(from, form.getFieldValue("to"));
      this.props.updateAmount(from, form.getFieldValue('amount'));
      this.props.onSend(from);

      form.resetFields();
      this.setState({ advanced: false });
    });
  }

  handleClick = (gasPrice, gasLimit, nonce) => {
    let from = this.props.from;

    this.props.updateGasLimit(from, gasLimit);
    this.props.updateGasPrice(from, gasPrice);
    this.props.updateNonce(from, nonce);

  }

  checkWanAddr = (rule, value, callback) => {
    console.log('rule', rule, 'value', value)
    let ret = checkWanAddr(value);
  }

  render() {
    const { loading, form, visible, from } = this.props;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { getFieldDecorator } = form;
    const AdvancedOptionForm = this.advancedOptionForm;
    let minFee = new BigNumber(this.minGasPrice).times(gasLimit).div(BigNumber(10).pow(9));
    let averageFee = new BigNumber(this.averageGasPrice).times(gasLimit).div(BigNumber(10).pow(9));
    let maxFee = averageFee.times(2);
    let savedFee;


    if (this.state.advanced) {
      savedFee = new BigNumber(Math.max(this.minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9));
    }

    return (
      <div>
        <Modal
          destroyOnClose={true}
          closable={false}
          visible={visible}
          title="Transaction"
          onCancel={this.onCancel}
          onOk={this.handleSend}
          footer={[
            <Button key="submit" type="primary" loading={loading} onClick={this.handleSend}>Send</Button>,
            <Button key="back" className="cancel" onClick={this.onCancel}>Cancel</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
            <Form.Item label="From">
              {getFieldDecorator('from', { initialValue: from }, { rules: [{ required: true, message: 'Address is incorrect' }] })
                (<Input disabled={true} placeholder="Sender Address" prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            <Form.Item label="To">
              {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect', validator: this.checkWanAddr }] })
                (<Input placeholder="Recipient Address" prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            <Form.Item label="Amount">
              {getFieldDecorator('amount', { rules: [{ required: true, message: 'Amount is incorrect', validator: this.checkAmount }] })
                (<InputNumber placeholder="0" prefix={<Icon type="money-collect" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
            </Form.Item>
            {
              this.state.advanced ?
                <Form.Item label="Fee">
                  {getFieldDecorator('fee', { initialValue: savedFee.toString(10), rules: [{ required: true, message: "Please select transaction fee" }] })(
                    <Input disabled={true} style={{ color: 'rgba(0,0,0,.25)' }} />
                  )}
                </Form.Item> :
                <Form.Item label="Fee">
                  {getFieldDecorator('fixFee', { rules: [{ required: true, message: "Please select transaction fee" }] })(
                    <Radio.Group>
                      <Radio.Button onClick={() => this.handleClick(this.minGasPrice, gasLimit, nonce)} value="slow">Slow <br /> {minFee.toString(10)} WAN</Radio.Button>
                      <Radio.Button onClick={() => this.handleClick(this.averageGasPrice, gasLimit, nonce)} value="average">Average <br /> {averageFee.toString(10)} WAN</Radio.Button>
                      <Radio.Button onClick={() => this.handleClick(this.maxGasPrice, gasLimit, nonce)} value="fast">Fast <br /> {maxFee.toString(10)} WAN</Radio.Button>
                    </Radio.Group>
                  )}
                </Form.Item>
            }
            <p className="onAdvancedT" onClick={this.onAdvanced}>Advanced Options</p>
          </Form>
        </Modal>
        <AdvancedOptionForm
          visible={this.state.advancedVisible}
          minGasPrice={this.minGasPrice}
          gasPrice={gasPrice}
          gasLimit={gasLimit}
          nonce={nonce}
          onCancel={this.handleCancel}
          onSave={this.handleSave}
          from={from}
        />
      </div>
    );
  }
}

export default NormalTransForm;



