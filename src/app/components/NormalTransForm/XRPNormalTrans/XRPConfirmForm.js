import { observe } from 'mobx';
import intl from 'react-intl-universal';
import React, { useContext, useState } from 'react';
import { Button, Modal, Form, Input } from 'antd';
import { observer, MobXProviderContext } from 'mobx-react';

import style from '../index.less';

const XRPConfirmForm = observer(({ visible, onCancel, sendTrans, from, form, fee }) => {
  const { languageIntl, sendTransParams: { XRPTransParams } } = useContext(MobXProviderContext)
  const { getFieldDecorator } = form;
  const [loading, setLoading] = useState(false);
  console.log(XRPTransParams, 'kkkkkkkkkkkkkkkkkkkkkkkkkkk')
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
          {getFieldDecorator('from', { initialValue: from })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('NormalTransForm.ConfirmForm.to')}>
          {getFieldDecorator('to', { initialValue: XRPTransParams.to })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('Common.amount')}>
          {getFieldDecorator('amount', { initialValue: XRPTransParams.value })
            (<Input disabled={true} />)}
        </Form.Item>
        <Form.Item label={intl.get('NormalTransForm.fee')}>
          {getFieldDecorator('fee', { initialValue: fee })
            (<Input disabled={true} />)}
        </Form.Item>
        {
          XRPTransParams.tag &&
          <Form.Item label={'Destination Tag'}>
            {getFieldDecorator('tag', { initialValue: XRPTransParams.tag })
              (<Input disabled={true} />)}
          </Form.Item>
        }
      </Form>
    </Modal>
  )
})

export default XRPConfirmForm;
