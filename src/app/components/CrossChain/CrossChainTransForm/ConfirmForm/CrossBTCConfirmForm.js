import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { INBOUND } from 'utils/settings';
import { getFullChainName } from 'utils/helper';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams
}))

@observer
class CrossBTCConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, totalFeeTitle, handleCancel, direction } = this.props;
    const { value, toAddr, storeman, btcAddress, amount } = this.props.BTCCrossTransParams;
    let desChain, storemanAccount, sendValue, symbol;

    if (direction === INBOUND) {
      symbol = 'BTC'
      desChain = 'WAN';
      sendValue = value;
      storemanAccount = btcAddress;
    } else {
      symbol = 'WBTC'
      desChain = 'BTC';
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
          <Button key="back" className="cancel-button" onClick={handleCancel}>{intl.get('NormalTransForm.ConfirmForm.cancel')}</Button>,
          <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={sendTrans}>{intl.get('Common.send')}</Button>,
        ]}
      >
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className="transForm">
          {
            direction !== INBOUND &&
            <Form.Item label={intl.get('NormalTransForm.ConfirmForm.from') + ' (' + getFullChainName('WAN') + ')'}>
              {getFieldDecorator('from', { initialValue: from })(inputCom)}
            </Form.Item>
          }
          <Form.Item label={intl.get('CrossChainTransForm.storemanAccount')}>
            {getFieldDecorator('storemanAccount', { initialValue: storemanAccount })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}>
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
