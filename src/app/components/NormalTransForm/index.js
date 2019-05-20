import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber, message } from 'antd';

import './index.less';
import { toWei } from 'utils/support';
import { checkWanAddr } from 'utils/helper';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';

const DEFAULT_GAS = 4700000;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  rawTx: stores.sendTransParams.rawTx,
  from: stores.sendTransParams.currentFrom,
  gasFeeArr: stores.sendTransParams.gasFeeArr,
  transParams: stores.sendTransParams.transParams,
  minGasPrice: stores.sendTransParams.minGasPrice,
  maxGasPrice: stores.sendTransParams.maxGasPrice,
  averageGasPrice: stores.sendTransParams.averageGasPrice,
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class NormalTransForm extends Component {
  state = {
    advanced: false,
    confirmVisible: false,
    advancedVisible: false,
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
    const { rawTx, onSend, updateTransParams } = this.props;
    let form = this.props.form;
    let from = this.props.from;

    form.validateFields(err => {
      if (err) return;
      updateTransParams(from, { to: form.getFieldValue('to'), amount: form.getFieldValue('amount') })
      onSend(from, rawTx);

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
    const { loading, form, from, minGasPrice, maxGasPrice, averageGasPrice, gasFeeArr } = this.props;
    const { advancedVisible, confirmVisible, advanced } = this.state;
    const { gasPrice, gasLimit, nonce } = this.props.transParams[from];
    const { minFee, averageFee, maxFee } = gasFeeArr
    const { getFieldDecorator } = form;

    let savedFee = advanced ? new BigNumber(Math.max(minGasPrice, gasPrice)).times(gasLimit).div(BigNumber(10).pow(9)) : '';

    return (
      <div>
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
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
                    <Radio.Button onClick={() => this.handleClick(minGasPrice, gasLimit, nonce)} value="slow"><p>Slow</p>{minFee} WAN</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(averageGasPrice, gasLimit, nonce)} value="average"><p>Average</p>{averageFee} WAN</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(maxGasPrice, gasLimit, nonce)} value="fast"><p>Fast</p>{maxFee} WAN</Radio.Button>
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