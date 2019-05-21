import React, { Component } from 'react';
import { Button, Modal, Form, Input, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';

import './index.less';

@inject(stores => ({
  transParams: stores.sendTransParams.transParams,
}))

@observer
class ConfirmForm extends Component {
  handleCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    this.props.sendTrans();
  }

  render() {
    const { visible, form, from, loading, sendTrans } = this.props;
    const { getFieldDecorator } = form;
    const { to, amount, gasLimit, gasPrice, nonce } = this.props.transParams[from];

    let fee = new BigNumber(gasPrice).times(gasLimit).div(BigNumber(10).pow(9));

    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title="Transaction Confirm"
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>Cancel</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>Send</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label="From">
            {getFieldDecorator('from', { initialValue: from })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label="To">
            {getFieldDecorator('to', { initialValue: to })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label="Amount">
            {getFieldDecorator('amount', { initialValue: amount })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label="Gas Price (GWIN)"> {
            getFieldDecorator(
              'gasPrice', { initialValue: gasPrice })
              (<Input disabled={true} />)
          }
          </Form.Item>
          <Form.Item label="Gas Limit">
            {getFieldDecorator(
              'gasLimit', { initialValue: gasLimit })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label="Nonce">
            {getFieldDecorator(
              'nonce', { initialValue: nonce })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label="Fee">
            {getFieldDecorator('fee', { initialValue: fee.toString(10) })(
              <Input disabled={true} />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmForm;