import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';
import { INBOUND } from 'utils/settings';
import { hexCharCodeToStr } from 'utils/support';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  currTokenPairId: stores.crossChain.currTokenPairId,
}))

@observer
class ConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, estimateFee, handleCancel, tokenSymbol, transParams, tokenPairs, currTokenPairId, type, userNetWorkFee, received } = this.props;
    const { amount, toAddr, storeman, crossType, crosschainFee } = transParams[from];
    const info = Object.assign({}, tokenPairs[currTokenPairId]);
    let fromChain = type === INBOUND ? info.fromChainName : info.toChainName;
    let desChain = type === INBOUND ? info.toChainName : info.fromChainName;

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
          <Form.Item label={intl.get('Common.from') + ' (' + fromChain + ')'}>
            {getFieldDecorator('from', { initialValue: from })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.storemanGroup')}>
            {getFieldDecorator('storemanAccount', { initialValue: hexCharCodeToStr(storeman) })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + desChain + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          {/* <Form.Item label={intl.get('CrossChainTransForm.crossType')}>
            {getFieldDecorator('crossType', { initialValue: intl.get(`CrossChainTransForm.${crossType}`) })(inputCom)}
          </Form.Item> */}
          <Form.Item label={intl.get('Common.amount') + ` (${tokenSymbol})`}>
            {getFieldDecorator('amount', { initialValue: amount })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.transactionFee')}>
            {getFieldDecorator('transactionFee', { initialValue: userNetWorkFee })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.crosschainFee')}>
            {getFieldDecorator('crosschainFee', { initialValue: crosschainFee })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.youWillReceive')}>
            {getFieldDecorator('received', { initialValue: received })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default ConfirmForm;
