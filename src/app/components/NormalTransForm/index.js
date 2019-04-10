import React, { Component } from 'react';
import { Button, Modal, Form, Input, Radio } from 'antd';

class NormalTransForm extends Component {
  render() {
    const {
      visible, loading, onCancel, onSend, form
    } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        visible={visible}
        title="Transcation"
        onCancel={onCancel}
        onOk={onSend}
        footer={[
          <Button key="submit" type="primary" loading={loading} onClick={onSend}>Send</Button>,
          <Button key="back" onClick={onCancel}>Cancel</Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Title">
            {getFieldDecorator('title', {
              rules: [{ required: true, message: 'Please input the title of collection!' }],
            })(
              <Input />
            )}
          </Form.Item>
          <Form.Item label="Description">
            {getFieldDecorator('description')(<Input type="textarea" />)}
          </Form.Item>
          <Form.Item className="collection-create-form_last-form-item">
            {getFieldDecorator('modifier', {
              initialValue: 'public',
            })(
              <Radio.Group>
                <Radio value="public">Public</Radio>
                <Radio value="private">Private</Radio>
              </Radio.Group>
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default NormalTransForm;



