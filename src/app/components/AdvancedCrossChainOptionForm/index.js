import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, InputNumber, message } from 'antd';
import style from './index.less';

const MinGasLimit = 21000;
@inject(stores => ({
  language: stores.languageIntl.language,
  minGasPrice: stores.sendCrossChainParams.minGasPrice,
  transParams: stores.sendCrossChainParams.transParams,
  updateTransParams: (addr, paramsObj) => stores.sendCrossChainParams.updateTransParams(addr, paramsObj),
}))

@observer
class AdvancedCrossChainOptionForm extends Component {
  state = {
    loading: false
  }

  checkGasLimit = (rule, value, callback) => {
    value = Number(value);
    if (Number.isInteger(value) && value >= MinGasLimit) {
      callback();
    } else {
      callback(intl.get('AdvancedOptionForm.gasLimitIsIncorrect'));
    }
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.setState({ loading: true });
    let { from, form, updateTransParams, onSave } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        this.setState({ loading: false });
        return;
      };
      let gasPrice = form.getFieldValue('gasPrice');
      let gasLimit = form.getFieldValue('gasLimit');
      try {
        updateTransParams(from, { gasPrice, gasLimit });
        this.setState({ loading: false });
        onSave(gasPrice, gasLimit);
      } catch (e) {
        this.setState({ loading: false });
        message.warn(intl.get('NormalTransForm.estimateGasFailed'))
      }
    })
  }

  render() {
    const { form, minGasPrice, from, transParams, chainType } = this.props;
    const { getFieldDecorator } = form;
    const { gasPrice, gasLimit } = transParams[from];
    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={true}
        title={intl.get('AdvancedOptionForm.advancedOptions')}
        onCancel={this.handleCancel}
        onOk={this.handleSave}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={this.state.loading} onClick={this.handleSave}>{intl.get('AdvancedOptionForm.save')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
          <Form.Item label={intl.get('AdvancedOptionForm.gasPrice') + ' (' + (chainType === 'ETH' ? 'Gwei' : intl.get('AdvancedOptionForm.gwin')) + ')'}> {
            getFieldDecorator('gasPrice', { initialValue: gasPrice, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasPriceIsIncorrect') }] })
              (<InputNumber min={minGasPrice} />)
          }
          </Form.Item>
          <Form.Item label={intl.get('AdvancedOptionForm.gasLimit')}>
            {getFieldDecorator('gasLimit', { initialValue: gasLimit, rules: [{ required: true, message: intl.get('AdvancedOptionForm.gasLimitIsIncorrect'), validator: this.checkGasLimit }] })
              (<InputNumber />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedCrossChainOptionForm;
