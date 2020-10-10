import React, { Component } from 'react';
import { Form, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';

@observer
class AddDAppForm extends Component {
  checkUrl = (rule, value, callback) => {
    if (String(value).startsWith('https://')) {
      callback();
    } else {
      callback(intl.get('DApp.urlPlaceholder'));
    }
  }

  render() {
    const { form, handleSubmit } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Form
        onSubmit={handleSubmit}
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
    );
  }
}

export default AddDAppForm;
