import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber, message } from 'antd';
import { checkWanAddr } from 'utils/helper';

import './index.less';
import AdvancedOptionForm from 'components/AdvancedOptionForm';

const DEFAULTGASLIMIT = 4700000;
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class NormalTransForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible,
      advancedVisible: false,
      advanced: false
    }
    this.averageGasPrice = Math.max(this.props.minGasPrice, this.props.transParams[this.props.from].gasPrice);
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

    form.validateFields(err => {
      if (err) return;
      this.props.updateTransParams(from, {
        to: form.getFieldValue('to'),
        amount: form.getFieldValue('amount')
      })
      this.props.onSend(from);

      form.resetFields();
      this.setState({ advanced: false });
    });
  }

  handleClick = (gasPrice, gasLimit, nonce) => {
    this.props.updateTransParams(this.props.from, { gasLimit, gasPrice, nonce })
  }

  updateGasLimit = () => {
    let { form } = this.props;
    let from = form.getFieldValue('from');
    let tx = {
      from: from,
      to: form.getFieldValue('to'),
      value: form.getFieldValue('amount') || 0,
      data: this.props.transParams[from].data,
      gas: DEFAULTGASLIMIT
    };
    let { chainType } = this.props.transParams[from];
    wand.request('transaction_estimateGas', { chainType, tx }, (err, gasLimit) => {
      if (err) {
        message.warn("Estimate gas failed. Please try again");
        console.log(err);
      } else {
        console.log('Update gas limit:', gasLimit);
        this.props.updateTransParams(from, { gasLimit });
      }
    });
  }

  checkToWanAddr = (rule, value, callback) => {
    checkWanAddr(value).then(ret => {
      if (ret) {
        this.updateGasLimit();
        callback();
      } else {
        callback('Invalid address');
      }
    }).catch((err) => {
      callback(err);
    })
  }

  checkAmount = (rule, value, callback) => {
    if (value >= 0) {
      this.updateGasLimit();
      callback();
    } else {
      callback('Invalid amount');
    }
  }

  render() {
    const { advancedVisible, advanced } = this.state;
    const { loading, form, visible, from, minGasPrice, maxGasPrice } = this.props;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { getFieldDecorator } = form;
    let minFee = new BigNumber(minGasPrice).times(gasLimit).div(BigNumber(10).pow(9));
    let averageFee = new BigNumber(this.averageGasPrice).times(gasLimit).div(BigNumber(10).pow(9));
    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

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
                (<Input disabled={true} placeholder="Sender Address" prefix={<Icon type="wallet" className="colorInput" />} />)}
            </Form.Item>
            <Form.Item label="To">
              {getFieldDecorator('to', { rules: [{ required: true, message: 'Address is incorrect', validator: this.checkToWanAddr }] })
                (<Input placeholder="Recipient Address" prefix={<Icon type="wallet" className="colorInput" />} />)}
            </Form.Item>
            <Form.Item label="Amount">
              {getFieldDecorator('amount', { rules: [{ required: true, message: 'Amount is incorrect', validator: this.checkAmount }] })
                (<InputNumber placeholder="0" prefix={<Icon type="money-collect" className="colorInput" />} />)}
            </Form.Item>
            {
            advanced 
            ? <Form.Item label="Fee">
                {getFieldDecorator('fee', { initialValue: savedFee.toString(10), rules: [{ required: true, message: "Please select transaction fee" }] })(
                  <Input disabled={true} className="colorInput" />
                )}
              </Form.Item> 
            : <Form.Item label="Fee">
                {getFieldDecorator('fixFee', { rules: [{ required: true, message: "Please select transaction fee" }] })(
                  <Radio.Group>
                    <Radio.Button onClick={() => this.handleClick(minGasPrice, gasLimit, nonce)} value="slow">Slow <br /> {minFee.toString(10)} WAN</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(this.averageGasPrice, gasLimit, nonce)} value="average">Average <br /> {averageFee.toString(10)} WAN</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(maxGasPrice, gasLimit, nonce)} value="fast">Fast <br /> {averageFee.times(2).toString(10)} WAN</Radio.Button>
                  </Radio.Group>
                )}
              </Form.Item>
            }
            <p className="onAdvancedT" onClick={this.onAdvanced}>Advanced Options</p>
          </Form>
        </Modal>
        <AdvancedOption visible={advancedVisible} minGasPrice={minGasPrice} gasPrice={gasPrice} gasLimit={gasLimit} nonce={nonce} onCancel={this.handleCancel} onSave={this.handleSave} from={from} />
      </div>
    );
  }
}

export default NormalTransForm;