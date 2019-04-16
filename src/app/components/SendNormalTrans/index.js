import React, { Component } from 'react';
import { Modal, Button, Form } from 'antd';

import NormalTransForm from 'components/NormalTransForm'
import './index.less';

class SendNormalTrans extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      visible: false
    }
  }
  CollectionCreateForm = Form.create({ name: 'NormalTransForm' })(NormalTransForm);

  showModal = () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  saveFormRef = (formRef) => {
    this.formRef = formRef;
  }

  handleSend = () => {
    const form = this.formRef.props.form;
    form.validateFields((err, values) => {
      if (err) {
        return;
      }
      form.resetFields();
      this.setState({ loading: true });
      setTimeout(() => {
        this.setState({ loading: false, visible: false });
      }, 3000);
    });
  }

  render() {
    const CollectionCreateForm = this.CollectionCreateForm;
    
    return (
      <div>
        <Button type="primary" onClick={this.showModal}>Send</Button>
        <CollectionCreateForm wrappedComponentRef={this.saveFormRef} visible={this.state.visible} loading={this.state.loading} onCancel={this.handleCancel} onSend={this.handleSend}/>
      </div>
    );
  }
}

export default SendNormalTrans;