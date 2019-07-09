import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Row, Col } from 'antd';

import './index.less';

const LEFT = 8;
const RIGHT = 16;

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class ValidatorConfirmForm extends Component {
  render() {
    const { onCancel, record, onSend, title } = this.props;

    return (
      <div className="withdraw">
        <Modal visible destroyOnClose={true} closable={false} title={title} onCancel={onCancel} className="withdraw-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={onSend}>{intl.get('SendNormalTrans.send')}</Button>,
          ]}
        >
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('ValidatorRegister.validatorAccount')}</div>
            <div className="withdraw-line key-style">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.publicKey1')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.publicKey1}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line key-style">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.publicKey2')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.publicKey2}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.lockTime}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.feeRate}</span></Col>
              </Row>
            </div>
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.address')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.myAddr}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.entrustedAmount')}</span></Col>
                <Col span={RIGHT}><span className="withdraw-addr">{record.amount} WAN</span></Col>
              </Row>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ValidatorConfirmForm;