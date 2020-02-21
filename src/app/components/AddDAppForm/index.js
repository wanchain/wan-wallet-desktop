import React, { Component } from 'react';
import { Button, Select, Modal, Form, Input, Icon, Radio, Checkbox, message, Spin } from 'antd';
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
            <Button disabled={false} key="submit" type="primary" onClick={this.onOk}>{intl.get('Common.ok')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
            <Form.Item label={intl.get('DApp.titleCol')}>
              {getFieldDecorator('name')
                (<Input />)}
            </Form.Item>
            <Form.Item label={intl.get('DApp.urlCol')}>
              {getFieldDecorator('url')
                (<Input placeholder={'https://'} />)}
            </Form.Item>
            <Form.Item label={intl.get('DApp.addIcon')}>
              {getFieldDecorator('icon')
                (<Input />)}
            </Form.Item>
            <Form.Item label={intl.get('DApp.commitCol')}>
              {getFieldDecorator('commit')
                (<Input />)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default AddDAppForm;
