import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';
import { getFullChainName } from 'utils/helper';
import { INBOUND } from 'utils/settings';

const inputCom = <Input disabled={true} />

@inject(stores => ({
  language: stores.languageIntl.language,
  transParams: stores.sendCrossChainParams.transParams,
  tokenPairs: stores.crossChain.tokenPairs,
  currTokenPairId: stores.crossChain.currTokenPairId,
}))

@observer
class CrossEOSConfirmForm extends Component {
  render() {
    const { form: { getFieldDecorator }, from, loading, sendTrans, direction, estimateFee, handleCancel, tokenSymbol, tokenPairs, currTokenPairId } = this.props;
    const { amount, toAddr, storeman } = this.props.transParams[from];
    const info = Object.assign({}, tokenPairs[currTokenPairId]);
    let srcChain, desChain;

    if (direction === INBOUND) {
      srcChain = info.fromChainSymbol;
      desChain = info.toChainSymbol;
    } else {
      srcChain = info.toChainSymbol;
      desChain = info.fromChainSymbol;
    }
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
          <Form.Item label={intl.get('Common.from') + ' (' + getFullChainName(srcChain) + ')'}>
            {getFieldDecorator('from', { initialValue: from })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.storemanGroup')}>
            {getFieldDecorator('storemanAccount', { initialValue: storeman.replace(/^(\w{24})\w*(\w{24})$/g, '$1****$2') })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('NormalTransForm.to') + ' (' + getFullChainName(desChain) + ')'}>
            {getFieldDecorator('to', { initialValue: toAddr })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('CrossChainTransForm.estimateFee')}>
            {getFieldDecorator('fee', { initialValue: `${estimateFee}` })(inputCom)}
          </Form.Item>
          <Form.Item label={intl.get('Common.amount') + ` (${tokenSymbol})`}>
            {getFieldDecorator('amount', { initialValue: amount })(inputCom)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default CrossEOSConfirmForm;
