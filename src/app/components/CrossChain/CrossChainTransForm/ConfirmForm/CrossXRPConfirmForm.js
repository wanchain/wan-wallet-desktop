import intl from 'react-intl-universal';
import React, { useContext, useState } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { observer, MobXProviderContext } from 'mobx-react';

import style from '../index.less';

const CrossXRPConfirmForm = observer(({ visible, onCancel, sendTrans, form, userNetWorkFee, toName, crosschainNetWorkFee }) => {
  const { languageIntl, sendCrossChainParams: { XRPCrossTransParams, record } } = useContext(MobXProviderContext)
  const { getFieldDecorator } = form;
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
    sendTrans();
  }

  return (
    <Modal
      destroyOnClose
      closable={false}
      visible={visible}
      title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
      onCancel={onCancel}
      footer={[
        <Button key="back" className="cancel-button" onClick={onCancel}>{intl.get('Common.cancel')}</Button>,
        <Button key="submit" type="primary" className="confirm-button" loading={loading} onClick={handleClick}>{intl.get('Common.send')}</Button>,
      ]}
    >
      <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
        <Form.Item label={intl.get('Common.from')}>
          {getFieldDecorator('from', { initialValue: record.name })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('Common.storemanGroup')}>
          {getFieldDecorator('to', { initialValue: XRPCrossTransParams.groupName })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
          {getFieldDecorator('to', { initialValue: toName })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('Common.amount')}>
          {getFieldDecorator('amount', { initialValue: XRPCrossTransParams.value })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('CrossChainTransForm.userNetworkFee')}>
          {getFieldDecorator('userNetWorkFee', { initialValue: userNetWorkFee })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('CrossChainTransForm.crossChainNetworkFee')}>
          {getFieldDecorator('crosschainNetWorkFee', { initialValue: crosschainNetWorkFee })
            (<Input disabled={true} />)}
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default CrossXRPConfirmForm;
