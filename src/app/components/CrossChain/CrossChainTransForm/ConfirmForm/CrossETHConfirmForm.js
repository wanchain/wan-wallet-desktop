import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { getFullChainName } from 'utils/helper';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendCrossChainParams.transParams,
}))

@observer
class CrossETHConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, estimateFee, handleCancel, tokenSymbol } = this.props;
    const { amount, toAddr, storeman } = this.props.transParams[from];
    let desChain, totalFeeTitle;

    if (chainType === 'ETH') {
      desChain = 'WAN';
      totalFeeTitle = `${estimateFee.original} ETH + ${estimateFee.destination} WAN`;
    } else {
      desChain = 'ETH';
      totalFeeTitle = `${estimateFee.original} WAN + ${estimateFee.destination} ETH`;
    }

    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={visible}
        title={intl.get('CrossChainTransForm.ConfirmForm.transactionConfirm')}
        onCancel={handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label={intl.get('Common.from') + ' (' + getFullChainName(chainType) + ')'}>
            {getFieldDecorator('from', { initialValue: from })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.storemanAccount')}>
            {getFieldDecorator('storemanAccount', { initialValue: storeman })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: totalFeeTitle })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${tokenSymbol})`}>
            {getFieldDecorator('amount', { initialValue: amount })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossETHConfirmForm;
