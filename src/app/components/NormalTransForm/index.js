import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber, message } from 'antd';
import { checkWanAddr } from 'utils/helper';
import { toWei } from 'utils/support';

import './index.less';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';

const DEFAULT_GAS = 4700000;
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);

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
      confirmVisible: false,
      advanced: false
    }
    this.averageGasPrice = Math.max(this.props.minGasPrice, this.props.transParams[this.props.from].gasPrice);
  }

  onAdvanced = () => {
    this.setState({
      advancedVisible: true,
    });
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
    this.onCancel();
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

      form.resetFields();
      this.setState({ advanced: false, confirmVisible: true });
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
    this.setState({
      confirmVisible: false,
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
      value: toWei((form.getFieldValue('amount') || 0).toString(10)),
      data: this.props.transParams[from].data,
      gas: DEFAULT_GAS
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
        if (!this.state.advanced) {
          this.updateGasLimit();
        }
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
      if (!this.state.advanced) {
        this.updateGasLimit();
      }
      callback();
    } else {
      callback('Invalid amount');
    }
  }

  render() {
    const { advancedVisible, confirmVisible, advanced } = this.state;
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
            <Button key="back" className="cancel" onClick={this.onCancel}>Cancel</Button>,
            <Button key="submit" type="primary" loading={loading} onClick={this.handleSend}>Send</Button>,
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
                (<InputNumber min={0} placeholder="0" prefix={<Icon type="money-collect" className="colorInput" />} />)}
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
        <AdvancedOption visible={advancedVisible} minGasPrice={minGasPrice} gasPrice={gasPrice} gasLimit={gasLimit} nonce={nonce} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} />
        <Confirm visible={confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} />
      </div>
    );
  }
}

export default NormalTransForm;