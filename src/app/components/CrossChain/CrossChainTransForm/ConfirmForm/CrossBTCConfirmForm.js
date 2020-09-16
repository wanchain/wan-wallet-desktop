import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { INBOUND } from 'utils/settings';
import { getFullChainName } from 'utils/helper';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams,
  currentTokenPairInfo: stores.crossChain.currentTokenPairInfo,
}))

@observer
class CrossBTCConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, totalFeeTitle, handleCancel, direction, currentTokenPairInfo: info } = this.props;
    const { value, toAddr, storeman, btcAddress, amount } = this.props.BTCCrossTransParams;
    let desChain, storemanAccount, sendValue, symbol;

    if (direction === INBOUND) {
      symbol = info.fromTokenSymbol;
      desChain = info.toChainName;
      sendValue = value;
      storemanAccount = btcAddress;
    } else {
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
              {getFieldDecorator('from', { initialValue: from })(inputCom)}
            </Form.Item>
          }
          <Form.Item label={intl.get('Common.storeman')}>
            {getFieldDecorator('storemanAccount', { initialValue: storemanAccount })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + desChain + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: totalFeeTitle })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${symbol})`}>
            {getFieldDecorator('amount', { initialValue: sendValue })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossBTCConfirmForm;
