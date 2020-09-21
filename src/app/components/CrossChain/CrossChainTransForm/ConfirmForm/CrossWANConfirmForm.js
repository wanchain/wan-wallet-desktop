import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { getFullChainName } from 'utils/helper';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
}))

@observer
class CrossWANConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, estimateFee, handleCancel, tokenSymbol, transParams, tokenPairs } = this.props;
    const { amount, toAddr, storeman, crossType } = this.props.transParams[from];
    const chainPairId = transParams[from].chainPairId;
    const tokenPairInfo = Object.assign({}, tokenPairs[chainPairId]);
    let fromChain = tokenPairInfo.fromChainName;
    let desChain = tokenPairInfo.toChainName;

    return (
      <Modal
        destroyOnClose={true}
        closable={false}
        visible={true}
        title={intl.get('CrossChainTransForm.ConfirmForm.transactionConfirm')}
        onCancel={handleCancel}
        footer={[
          <Button key="back" className="cancel-button" onClick={handleCancel}>{intl.get('Common.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          <Form.Item label={intl.get('Common.from') + ' (' + fromChain + ')'}>
            {getFieldDecorator('from', { initialValue: from })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.storeman')}>
            {getFieldDecorator('storemanAccount', { initialValue: storeman })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + desChain + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.crossType')}>
            {getFieldDecorator('crossType', { initialValue: intl.get(`CrossChainTransForm.${crossType}`) })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: estimateFee })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${tokenSymbol})`}>
            {getFieldDecorator('amount', { initialValue: amount })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossWANConfirmForm;
