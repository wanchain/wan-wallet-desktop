import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';

import { CHAINNAME, INBOUND } from 'utils/settings';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  BTCCrossTransParams: stores.sendCrossChainParams.BTCCrossTransParams
}))

@observer
class CrossBTCConfirmForm extends Component {
  render() {
    const { visible, form: { getFieldDecorator }, from, loading, sendTrans, chainType, totalFeeTitle, handleCancel, direction } = this.props;
    const { value, toAddr, storeman, btcAddress } = this.props.BTCCrossTransParams;
    let desChain, lockedAccount;

    if (direction === INBOUND) {
      desChain = 'WAN';
      lockedAccount = btcAddress;
    } else {
      desChain = 'BTC';
      lockedAccount = storeman;
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
            <Form.Item label={intl.get('NormalTransForm.ConfirmForm.from') + CHAINNAME['WAN']}>
              {getFieldDecorator('from', { initialValue: from })(inputCom)}
            </Form.Item>
          }
          <Form.Item label={intl.get('CrossChainTransForm.lockedAccount')}>
            {getFieldDecorator('lockedAccount', { initialValue: lockedAccount })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + CHAINNAME[desChain]}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: totalFeeTitle })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${chainType.toLowerCase()})`}>
            {getFieldDecorator('amount', { initialValue: value })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossBTCConfirmForm;
