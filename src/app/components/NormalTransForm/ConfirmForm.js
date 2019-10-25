import React, { Component } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';

import './index.less';
import { formatNum } from 'utils/support';
import { TRANSTYPE } from 'utils/settings';

@inject(stores => ({
  language: stores.languageIntl.language,
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
    const { visible, form, from, loading, sendTrans, transType } = this.props;
    const { getFieldDecorator } = form;
    const { to, amount, gasLimit, gasPrice, nonce, data, transferTo, token } = this.props.transParams[from];
    let fee = new BigNumber(gasPrice).times(gasLimit).div(BigNumber(10).pow(9)).toString(10);
    let initialTo = transType === TRANSTYPE.tokenTransfer ? transferTo : to;
    let initialAmount = transType === TRANSTYPE.tokenTransfer ? token : amount;

    return (
      <Modal
        destroyOnClose
        closable={false}
        visible={visible}
        title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
        onCancel={this.handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={this.handleCancel}>{intl.get('NormalTransForm.ConfirmForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.from')}>
            {getFieldDecorator('from', { initialValue: from })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
            {getFieldDecorator('to', { initialValue: initialTo })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount')}>
            {getFieldDecorator('amount', { initialValue: formatNum(initialAmount) })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.gasPrice') + ' (' + intl.get('NormalTransForm.ConfirmForm.gwin') + ')'}> {
            getFieldDecorator(
              'gasPrice', { initialValue: gasPrice })
              (<Input disabled={true} />)
          }
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.gasLimit')}>
            {getFieldDecorator(
              'gasLimit', { initialValue: formatNum(gasLimit) })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.nonce')}>
            {getFieldDecorator(
              'nonce', { initialValue: nonce })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.fee')}>
            {getFieldDecorator('fee', { initialValue: fee })(
              <Input disabled={true} />
            )}
          </Form.Item>
          {
            data !== '0x' &&
            <Form.Item label={intl.get('NormalTransForm.ConfirmForm.inputData')}>
              {getFieldDecorator('inputData', { initialValue: data })(
                <Input.TextArea disabled={true} />
              )}
            </Form.Item>
          }
        </Form>
      </Modal>
    );
  }
}

export default ConfirmForm;
