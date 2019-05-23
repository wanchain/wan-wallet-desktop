import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Radio, InputNumber, message } from 'antd';
import intl from 'react-intl-universal';

import './index.less';
import { toWei } from 'utils/support';
import { checkWanAddr } from 'utils/helper';
import AdvancedOptionForm from 'components/AdvancedOptionForm';
import ConfirmForm from 'components/NormalTransForm/ConfirmForm';

const DEFAULT_GAS = 4700000;
const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  language: stores.languageIntl.language,
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

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
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

  handleNext = () => {
    const { updateTransParams } = this.props;
    let form = this.props.form;
    let from = this.props.from;

    form.validateFields(err => {
      if (err) return;
      updateTransParams(from, { to: form.getFieldValue('to'), amount: form.getFieldValue('amount') })
      this.setState({ advanced: false, confirmVisible: true });
    });
  }

  sendTrans = () => {
    this.props.onSend(this.props.from);
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
        message.warn(intl.get('NormalTransForm.estimateGasFailed'));
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
        callback(intl.get('NormalTransForm.invalidAddress'));
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
      callback(intl.get('NormalTransForm.invalidAmount'));
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
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
            <Form.Item label={intl.get('NormalTransForm.from')}>
              {getFieldDecorator('from', { initialValue: from })
                (<Input disabled={true} placeholder={intl.get('NormalTransForm.senderAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
            </Form.Item>
            <Form.Item label={intl.get('NormalTransForm.to')}>
              {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkToWanAddr }] })
                (<Input placeholder={intl.get('NormalTransForm.recipientAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
            </Form.Item>
            <Form.Item label={intl.get('NormalTransForm.amount')}>
              {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                (<InputNumber min={0} placeholder="0" prefix={<Icon type="money-collect" className="colorInput" />} />)}
            </Form.Item>
            {
            advanced 
            ? <Form.Item label={intl.get('NormalTransForm.fee')}>
                {getFieldDecorator('fee', { initialValue: savedFee.toString(10), rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                  <Input disabled={true} className="colorInput" />
                )}
              </Form.Item> 
            : <Form.Item label={intl.get('NormalTransForm.fee')}>
                {getFieldDecorator('fixFee', { rules: [{ required: true, message: intl.get('NormalTransForm.pleaseSelectTransactionFee') }] })(
                  <Radio.Group>
                    <Radio.Button onClick={() => this.handleClick(minGasPrice, gasLimit, nonce)} value="slow"><p>{intl.get('NormalTransForm.slow')}</p>{minFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(averageGasPrice, gasLimit, nonce)} value="average"><p>{intl.get('NormalTransForm.average')}</p>{averageFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                    <Radio.Button onClick={() => this.handleClick(maxGasPrice, gasLimit, nonce)} value="fast"><p>{intl.get('NormalTransForm.fast')}</p>{maxFee} {intl.get('NormalTransForm.wan')}</Radio.Button>
                  </Radio.Group>
                )}
              </Form.Item>
            }
            <p className="onAdvancedT" onClick={this.onAdvanced}>{intl.get('NormalTransForm.advancedOptions')}</p>
          </Form>
        </Modal>
        <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} from={from} />
        <Confirm visible={confirmVisible} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading}/>
      </div>
    );
  }
}

export default NormalTransForm;