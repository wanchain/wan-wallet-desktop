import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Row, Col } from 'antd';
import { wanPubKey2Address } from 'utils/helper';

import './index.less';

const LEFT = 8;
const RIGHT = 16;

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class ValidatorConfirmForm extends Component {
  render() {
    const { onCancel, record, onSend, title, showConfirmItem } = this.props;
    const { publicKey1, publicKey2, validatorAccount, lockTime, feeRate, myAddr, amount, acceptDelegation } = showConfirmItem;

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
            {
              publicKey1 && 
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.publicKey1')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.publicKey1}</span></Col>
                </Row>
              </div> 
            }
            {
              publicKey2 && 
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.publicKey2')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.publicKey2}</span></Col>
                </Row>
              </div>
            }
            {
              validatorAccount && 
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.validatorAccount')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{wanPubKey2Address(record.publicKey1)}</span></Col>
                </Row>
              </div>
            }
            {
              lockTime && 
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.lockTime}{intl.get('days')}</span></Col>
                </Row>
              </div>
            }
            {
              acceptDelegation && 
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.agency')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{feeRate ? intl.get('ValidatorRegister.acceptAgency') : intl.get('ValidatorRegister.notAcceptAgency')}</span></Col>
                </Row>
              </div>
            }
            {
              feeRate &&             
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.feeRate}</span></Col>
                </Row>
              </div>
            }
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('ValidatorRegister.myAccount')}</div>
            {
              myAddr &&
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.address')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.myAddr}</span></Col>
                </Row>
              </div>
            }
            {
              amount && 
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.entrustedAmount')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.amount} WAN</span></Col>
                </Row>
              </div>
            }
          </div>
        </Modal>
      </div>
    );
  }
}

export default ValidatorConfirmForm;