import React, { Component } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';

// import style from './index.less';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  // transParams: stores.sendTransParams.transParams,
}))

@observer
class EOSResourceManageConfirmForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    // this.props.sendTrans();
  }

  render() {
    const { visible, form, formData } = this.props;
    const { getFieldDecorator } = form;
    const { account, type, size } = formData;

    return (
      <Modal
        destroyOnClose
        closable={false}
        visible={visible}
        title={'Confirm'}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" /* loading={loading} */ onClick={this.handleSave}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
          <Form.Item label={'Account'}>
            {getFieldDecorator('account', { initialValue: account })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={'Amount'}>
            {getFieldDecorator('amount', { initialValue: size })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={'Type'}>
            {getFieldDecorator('type', { initialValue: type })
              (<Input disabled={true} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default EOSResourceManageConfirmForm;
