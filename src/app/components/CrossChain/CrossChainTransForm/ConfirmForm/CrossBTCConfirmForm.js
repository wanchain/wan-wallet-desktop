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
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
}))

@observer
class CrossBTCConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, handleCancel, direction, currentTokenPairInfo: info, userNetWorkFee, crosschainFee, name } = this.props;
    let desChain, storemanAccount, sendValue, symbol, toAddr;
    if (direction === INBOUND) {
      const { value, storeman } = this.props.BTCCrossTransParams;
      toAddr = this.props.BTCCrossTransParams.toAddr;
      symbol = info.fromTokenSymbol;
      desChain = info.toChainName;
      sendValue = value;
      storemanAccount = storeman;
    } else {
      const { storeman, amount } = this.props.transParams[from];
      toAddr = this.props.transParams[from].toAddr;
      symbol = info.toTokenSymbol;
      desChain = info.fromChainName;
      sendValue = amount;
      storemanAccount = storeman;
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
          {
            direction !== INBOUND &&
            <Form.Item label={intl.get('Common.from') + ' (' + info.toChainName + ')'}>
              {getFieldDecorator('from', { initialValue: name })(inputCom)}
            </Form.Item>
          }
          <Form.Item label={intl.get('Common.storemanGroup')}>
            {getFieldDecorator('storemanAccount', { initialValue: hexCharCodeToStr(storemanAccount) })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + desChain + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${symbol})`}>
            {getFieldDecorator('amount', { initialValue: sendValue })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.transactionFee')}>
            {getFieldDecorator('transactionFee', { initialValue: userNetWorkFee })
              (<Input disabled={true} />)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.crosschainFee')}>
            {getFieldDecorator('crosschainFee', { initialValue: crosschainFee })
              (<Input disabled={true} />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossBTCConfirmForm;
