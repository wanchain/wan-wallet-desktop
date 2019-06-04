import React, { Component } from 'react';
import { Button, Modal, Form, InputNumber } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  minGasPrice: stores.sendTransParams.minGasPrice,
  transParams: stores.sendTransParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendTransParams.updateTransParams(addr, paramsObj),
}))

@observer
class AdvancedOptionForm extends Component {
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

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    let from = this.props.from;
    let form = this.props.form;

    form.validateFields(err => {
      if(err) return;
      let gasLimit = this.props.form.getFieldValue('gasLimit');
      let gasPrice = this.props.form.getFieldValue('gasPrice');
      let nonce = this.props.form.getFieldValue('nonce');
      this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
      this.props.onSave();
    })
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
        title={intl.get('AdvancedOptionForm.advancedOptions')}
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('AdvancedOptionForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" onClick={this.handleSave}>{intl.get('AdvancedOptionForm.save')}</Button>,
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
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;



