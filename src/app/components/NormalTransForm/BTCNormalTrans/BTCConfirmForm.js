import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import style from '../index.less';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendTransParams.BTCTransParams,
}))

@observer
class BTCConfirmForm extends Component {
  render() {
    const { visible, form, loading, sendTrans, fee, onCancel } = this.props;
    const { getFieldDecorator } = form;
    const { to, value } = this.props.transParams;

    return (
      <Modal
        destroyOnClose
        closable={false}
        visible={visible}
        title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
        onCancel={onCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={onCancel}>{intl.get('NormalTransForm.ConfirmForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
            {getFieldDecorator('to', { initialValue: to })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount')}>
            {getFieldDecorator('amount', { initialValue: formatNum(value) })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.fee')}>
            {getFieldDecorator('fee', { initialValue: fee })
              (<Input disabled={true} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default BTCConfirmForm;
