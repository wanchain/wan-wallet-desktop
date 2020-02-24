import React, { Component } from 'react';
import { Button, Modal, Form, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
  addCustomDApp: (obj) => stores.dapps.addCustomDApp(obj),
}))

@observer
class AddDAppForm extends Component {
  onCancel = () => {
    this.props.onCancel();
  }

  onOk = () => {
    this.props.onOk();
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log('Received values of form: ', values);
        let ret = this.props.addCustomDApp(values);
        if (!ret) {
          message.error(intl.get('DApp.addFailed'));
        } else {
          this.props.onOk();
          console.log('add dapp success');
          message.success(intl.get('DApp.addSuccess'));
        }
      }
    });
  };

  checkUrl = (rule, value, callback) => {
    if (value.startsWith('https://')) {
      callback();
    } else {
      callback(intl.get('DApp.urlPlaceholder'));
    }
  }

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <div>
        <Modal
          visible
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('DApp.addTitle')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" disabled={false} type="primary" htmlType="submit" onClick={this.handleSubmit}>{intl.get('Common.ok')}</Button>,
          ]}
        >
          <Form
            onSubmit={this.handleSubmit}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
            className={style.transForm}>
            <Form.Item label={intl.get('DApp.titleCol')}>
              {getFieldDecorator('name', { rules: [{ required: true, message: intl.get('DApp.namePlaceholder') }] })
                (<Input />)}
            </Form.Item>
            <Form.Item label={intl.get('DApp.urlCol')}>
              {getFieldDecorator('url', { rules: [{ required: true, message: intl.get('DApp.urlPlaceholder'), validator: this.checkUrl }] })
                (<Input placeholder={'https://'} />)}
            </Form.Item>
            {/* <Form.Item label={intl.get('DApp.addIcon')}>
              {getFieldDecorator('icon')
                (<Input />)}
            </Form.Item> */}
            <Form.Item label={intl.get('DApp.commitCol')}>
              {getFieldDecorator('commit')
                (<Input placeholder={intl.get('DApp.commitPlaceholder')} />)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default AddDAppForm;
