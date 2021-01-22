import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, InputNumber, Input, message } from 'antd';
import { TRANSTYPE } from 'utils/settings';

import style from './index.less';

const MinGasLimit = 21000;
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
    if (Number.isInteger(value) && value >= MinGasLimit) {
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
    if (value.slice(0, 2) === '0x') {
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
    let { from, form } = this.props;

    form.validateFields((err, { gasPrice, gasLimit, nonce, inputData: data }) => {
      if (err) {
        this.setState({ loading: false });
        return;
      };
      try {
        this.props.updateTransParams(from, { gasLimit, gasPrice, nonce, data });
        this.setState({ loading: false });
        this.props.onSave();
      } catch (e) {
        this.setState({ loading: false });
        message.warn(intl.get('NormalTransForm.estimateGasFailed'))
      }
    })
  }

  render() {
    const { visible, form, minGasPrice, from, transParams, transType, chain } = this.props;
    const { getFieldDecorator } = form;
    const { gasLimit, gasPrice, nonce, data } = transParams[from];
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title={intl.get('AdvancedOptionForm.advancedOptions')}
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={this.state.loading} onClick={this.handleSave}>{intl.get('AdvancedOptionForm.save')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
          <Form.Item label={intl.get('AdvancedOptionForm.gasPrice') + ' (' + (chain === 'ETH' ? 'Gwei' : intl.get('AdvancedOptionForm.gwin')) + ')'}> {
            getFieldDecorator('gasPrice', { initialValue: gasPrice, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasPriceIsIncorrect') }] })
              (<InputNumber min={minGasPrice} />)
          }
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.gasLimit')}>
            {getFieldDecorator('gasLimit', { initialValue: gasLimit, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasLimitIsIncorrect'), validator: this.checkGasLimit }] })
              (<InputNumber />)}
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.nonce')}>
            {getFieldDecorator('nonce', { initialValue: nonce, rules: [{ required: true, message: intl.get('AdvancedOptionForm.nonceIsIncorrect'), validator: this.checkNonce }] })
              (<InputNumber min={0} />)}
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.inputData')}>
            {getFieldDecorator(
              'inputData', { initialValue: data, rules: [{ required: true, message: intl.get('AdvancedOptionForm.inputDataIsIncorrect'), validator: this.checkInputData }] })
              (<Input.TextArea disabled={transType === TRANSTYPE.tokenTransfer} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;
