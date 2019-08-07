import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import { estimateGas } from 'utils/helper';

@inject(stores => ({
  language: stores.languageIntl.language,
  minGasPrice: stores.sendTransParams.minGasPrice,
  transParams: stores.sendTransParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class AdvancedOptionForm extends Component {
  state = {
    loading: false
  }

  checkGasLimit = (rule, value, callback) => {
    if (Number.isInteger(value)) {
      callback();
    } else {
      callback(intl.get('AdvancedOptionForm.gasLimitIsIncorrect'));
    }
  }

  checkNonce = (rule, value, callback) => {
    if (Number.isInteger(value)) {
      callback();
    } else {
      callback(intl.get('AdvancedOptionForm.nonceIsIncorrect'));
    }
  }

  checkInputData = (rule, value, callback) => {
    if (value.slice(0, 2) === '0x' && value.length % 2 === 0) {
      callback();
    } else {
      callback(intl.get('AdvancedOptionForm.inputDataIsIncorrect'));
    }
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.setState({ loading: true });
    let from = this.props.from;
    let form = this.props.form;

    form.validateFields(err => {
      if (err) return;
      let gasPrice = this.props.form.getFieldValue('gasPrice');
      let nonce = this.props.form.getFieldValue('nonce');
      let data = this.props.form.getFieldValue('inputData');
      estimateGas('WAN', {
        from,
        to: this.props.transParams[from].to,
        data: data
      }).then(res => {
        form.setFieldsValue({
          gasLimit: res
        });
        this.props.updateTransParams(from, { gasLimit: res, gasPrice, nonce, data });
        this.setState({ loading: false });
        this.props.onSave();
      }).catch(() => {
        this.setState({ loading: false });
        message.warn(intl.get('NormalTransForm.estimateGasFailed'))
      })
    })
  }

  render () {
    const { visible, form, minGasPrice, from, transParams } = this.props;
    const { getFieldDecorator } = form;
    const { gasLimit, gasPrice, nonce } = transParams[from];
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title={intl.get('AdvancedOptionForm.advancedOptions')}
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('AdvancedOptionForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={this.state.loading} onClick={this.handleSave}>{intl.get('AdvancedOptionForm.save')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label={intl.get('AdvancedOptionForm.gasPrice') + ' (' + intl.get('AdvancedOptionForm.gwin') + ')'}> {
            getFieldDecorator('gasPrice', { initialValue: gasPrice, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasPriceIsIncorrect') }] })
              (<InputNumber min={minGasPrice} />)
          }
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.gasLimit')}>
            {getFieldDecorator('gasLimit', { initialValue: gasLimit, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasLimitIsIncorrect'), validator: this.checkGasLimit }] })
              (<InputNumber min={21000} />)}
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.nonce')}>
            {getFieldDecorator(
              'nonce', { initialValue: nonce, rules: [{ required: true, message: intl.get('AdvancedOptionForm.nonceIsIncorrect'), validator: this.checkNonce }] })
              (<InputNumber min={0} />)}
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.inputData')}>
            {getFieldDecorator(
              'inputData', { initialValue: '0x', rules: [{ required: true, message: intl.get('AdvancedOptionForm.inputDataIsIncorrect'), validator: this.checkInputData }] })
              (<Input />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;
