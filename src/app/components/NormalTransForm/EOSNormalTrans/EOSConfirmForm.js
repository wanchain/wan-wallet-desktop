import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';
import style from '../index.less';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class EOSConfirmForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.props.sendTrans();
  }

  render() {
    const { form, sendTrans, loading } = this.props;
    const { getFieldDecorator } = form;
    const { from, to, amount, memo } = this.props.formData;
    return (
      <Modal
        destroyOnClose
        closable={false}
        visible
        title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" onClick={sendTrans} loading={loading}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
          <Form.Item label={intl.get('Common.from')}>
            {getFieldDecorator('from', { initialValue: from })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
            {getFieldDecorator('to', { initialValue: to })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount')}>
            {getFieldDecorator('amount', { initialValue: formatNum(amount) })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('EOSNormalTransForm.memo')}>
            {getFieldDecorator('memo', { initialValue: memo })
              (<Input disabled={true} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default EOSConfirmForm;
