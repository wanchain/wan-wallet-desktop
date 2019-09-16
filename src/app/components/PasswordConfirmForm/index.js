import React, { Component } from 'react';
import { Modal, Form, Input, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language
}))

@observer
class PasswordConfirmForm extends Component {
  handleSave = () => {
    let form = this.props.form;

    form.validateFields(err => {
      if (err) {
        return;
      };
      this.props.handleOk(form.getFieldValue('password'));
    });
  }

  render () {
    const { form, showConfirm, handleOk, handleCancel } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        destroyOnClose={true}
        title={intl.get('PasswordConfirmForm.inputPwd')}
        visible={showConfirm}
        onOk={this.handleSave}
        onCancel={handleCancel}
        closable={false}
        okText={intl.get('popup.ok')}
        cancelText={intl.get('popup.cancel')}
      >
        <Form layout="inline" onSubmit={this.handleSave}>
          <Form.Item >
            {getFieldDecorator('password', {
              rules: [{ required: true, message: intl.get('PasswordConfirmForm.pwdMessage') }],
            })(
              <Input
                prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                type="password"
                placeholder={intl.get('PasswordConfirmForm.password')}
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default PasswordConfirmForm;
