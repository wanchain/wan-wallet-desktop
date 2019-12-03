import React, { Component } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class EOSResourceManageConfirmForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    const { form } = this.props;
    this.props.sendTrans(form.getFieldsValue());
  }

  render() {
    const { form, formData } = this.props;
    const { getFieldDecorator } = form;
    const { account, type, amount } = formData;

    return (
      <Modal
        destroyOnClose
        closable={false}
        visible={true}
        title={intl.get('EOSResourceManageForm.confirm')}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" onClick={this.handleSave}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
          { (type === 'buy' || type === 'delegate') && <Form.Item label={intl.get('EOSResourceManageForm.account')}>
            {getFieldDecorator('account', { initialValue: account })
              (<Input disabled={true} />)}
          </Form.Item>}
          <Form.Item label={intl.get('EOSResourceManageForm.amount')}>
            {getFieldDecorator('amount', { initialValue: amount })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('EOSResourceManageForm.type')}>
            {getFieldDecorator('type', { initialValue: type })
              (<Input disabled={true} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default EOSResourceManageConfirmForm;
