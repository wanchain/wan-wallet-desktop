import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, InputNumber, message } from 'antd';
import style from './index.less';
import { MAX_BTC_FEE_RATE } from 'utils/settings';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class AdvancedBTCCrossChainOptionForm extends Component {
  state = {
    loading: false
  }

  checkFeeRate = (rule, value, callback) => {
    if (typeof value === 'number' && value > 0 && value <= MAX_BTC_FEE_RATE) {
      callback();
    } else {
      callback(intl.get('AdvancedOptionForm.feeRateIsIncorrect'));
    }
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.setState({ loading: true });
    let { form, onSave } = this.props;
    form.validateFields((err, values) => {
      if (err) {
        this.setState({ loading: false });
        return;
      };
      onSave(values.feeRate);
    })
  }

  render() {
    const { form, value } = this.props;
    const { getFieldDecorator } = form;
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
          <Form.Item label={intl.get('AdvancedOptionForm.feeRate')}>
            {getFieldDecorator('feeRate', { initialValue: value, rules: [{ required: true, validator: this.checkFeeRate }] })
              (<InputNumber />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default AdvancedBTCCrossChainOptionForm;
