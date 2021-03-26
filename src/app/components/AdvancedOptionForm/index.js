import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, InputNumber, Input, message } from 'antd';
import { TRANSTYPE, DEBOUNCE_DURATION } from 'utils/settings';
import { converter } from 'utils/helper';
import { debounce } from 'lodash';
import style from './index.less';

const MIN_GAS_LIMIT = 21000;
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
    if (Number.isInteger(value) && value >= MIN_GAS_LIMIT) {
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

  checkInputData = debounce((rule, value, callback) => {
    value = value.toString().trim();
    if ((/^0x([0-9a-fA-F]{2})*$/g).test(value)) {
      this.estimateGas();
      callback();
    } else if ((/^0x/g).test(value)) {
      callback(intl.get('AdvancedOptionForm.inputDataIsIncorrect'));
    } else {
      this.estimateGas();
      callback();
    }
  }, DEBOUNCE_DURATION)

  estimateGas = () => {
    const { estimateGas, form } = this.props;
    const inputs = form.getFieldsValue(['nonce', 'gasPrice', 'gasLimit', 'inputData']);
    estimateGas(inputs).then(result => {
      if (result) {
        const { gas, data } = result;
        converter(data, 'hex', 'utf8').then(res => {
          let inputData = form.getFieldValue('inputData');
          if (res === inputData) {
            form.setFieldsValue({
              gasLimit: Math.max(gas, MIN_GAS_LIMIT)
            });
          }
        });
      }
    });
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
        if (this.props.transType === TRANSTYPE.tokenTransfer) {
          this.props.updateTransParams(from, { gasLimit, gasPrice, nonce });
        } else {
          this.props.updateTransParams(from, { gasLimit, gasPrice, nonce, data });
        }
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
    const isToken = transType === TRANSTYPE.tokenTransfer;
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
          <Form.Item label={intl.get('AdvancedOptionForm.gasPrice') + ' (' + (chain === 'ETH' || chain === 'BNB' ? 'Gwei' : intl.get('AdvancedOptionForm.gwin')) + ')'}>
            {
              getFieldDecorator('gasPrice', { initialValue: gasPrice, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasPriceIsIncorrect') }] })
                (<InputNumber min={minGasPrice} />)
            }
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.gasLimit')}>
            {
              getFieldDecorator('gasLimit', { initialValue: gasLimit, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasLimitIsIncorrect'), validator: this.checkGasLimit }] })
                (<InputNumber />)
            }
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.nonce')}>
            {
              getFieldDecorator('nonce', { initialValue: nonce, rules: [{ required: true, message: intl.get('AdvancedOptionForm.nonceIsIncorrect'), validator: this.checkNonce }] })
                (<InputNumber min={0} />)
            }
          </Form.Item>
          {!isToken && <Form.Item label={intl.get('AdvancedOptionForm.inputData')}>
            {
              getFieldDecorator(
                'inputData', { initialValue: data, rules: [{ required: true, message: intl.get('AdvancedOptionForm.inputDataIsIncorrect'), validator: this.checkInputData }] })
                (<Input.TextArea disabled={isToken} />)
            }
          </Form.Item>}
        </Form>
      </Modal>
    );
  }
}

export default AdvancedOptionForm;
