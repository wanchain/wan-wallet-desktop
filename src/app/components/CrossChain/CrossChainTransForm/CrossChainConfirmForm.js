import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { CHAINNAME } from 'utils/settings';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendCrossChainParams.transParams,
}))

@observer
class CrossChainConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, estimateFee, handleCancel } = this.props;
    const { amount, toAddr, storeman } = this.props.transParams[from];
    let desChain, totalFeeTitle;
    if (chainType === 'ETH') {
      desChain = 'WAN';
      totalFeeTitle = `${estimateFee.original} eth + ${estimateFee.destination} wan`;
    } else {
      desChain = 'ETH';
      totalFeeTitle = `${estimateFee.original} wan + ${estimateFee.destination} eth`;
    }

    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title={intl.get('CrossChainTransForm.ConfirmForm.transactionConfirm')}
        onCancel={handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={handleCancel}>{intl.get('NormalTransForm.ConfirmForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label={intl.get('NormalTransForm.ConfirmForm.from') + CHAINNAME[chainType]}>
            {getFieldDecorator('from', { initialValue: from })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.lockedAccount')}>
            {getFieldDecorator('lockedAccount', { initialValue: storeman })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + CHAINNAME[desChain]}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: totalFeeTitle })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${chainType.toLowerCase()})`}>
            {getFieldDecorator('fee', { initialValue: amount })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossChainConfirmForm;
