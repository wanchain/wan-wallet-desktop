import React, { Component } from 'react';
import { Button, Modal, Form, Input, Icon, Slider } from 'antd';

import './index.less';

class NormalTransForm extends Component {
  render() {
    const { visible, loading, onCancel, onSend, form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
      destroyOnClose={true}
        closable={false}
        visible={visible}
        title="Transcation"
        onCancel={onCancel}
        onOk={onSend}
        footer={[
          <Button key="submit" type="primary" loading={loading} onClick={onSend}>Send</Button>,
          <Button key="back" className="cancel" onClick={onCancel}>Cancel</Button>,
        ]}
      >
        <Form layout="vertical" className="transForm">
          <Form.Item label="To">
            {getFieldDecorator('To', { rules: [{ required: true, message: 'Please input the public address!' }] })(<Input placeholder="Please paste public address here" prefix={<Icon type="wallet" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
          </Form.Item>
          <Form.Item label="Amount">
          {getFieldDecorator('Amount', { rules: [{ required: true, message: 'Please input the right amount!' }] })(<Input placeholder="0.0" prefix={<Icon type="money-collect" style={{ color: 'rgba(0,0,0,.25)' }} />} />)}
          </Form.Item>
          <Form.Item label="Amount">
            <Slider defaultValue={30} />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default NormalTransForm;



