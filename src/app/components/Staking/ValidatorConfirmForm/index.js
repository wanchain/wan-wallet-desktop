import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Row, Col, Alert } from 'antd';
import { wanPubKey2Address } from 'utils/helper';
import { formatNum } from 'utils/support';

import './index.less';

const LEFT = 8;
const RIGHT = 16;

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class ValidatorConfirmForm extends Component {
  render () {
    const { onCancel, record, onSend, title, showConfirmItem, confirmLoading } = this.props;
    const { publicKey1, publicKey2, validatorAccount, lockTime, feeRate, myAddr, amount, acceptDelegation } = showConfirmItem;

    return (
      <div className="withdraw">
        <Modal visible destroyOnClose={true} closable={false} title={title} onCancel={onCancel} className="withdraw-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button loading={!!confirmLoading} key="submit" type="primary" onClick={onSend}>{intl.get('Common.send')}</Button>,
          ]}
        >
          {/* Show warning when validator accepts delegations, but stake-in amount is less than 50,000 WAN */
            new BigNumber(record.amount).lt(50000) && publicKey1 && feeRate &&
            <Alert
              message={intl.get('ValidatorRegister.warning')}
              type="warning"
              closable
              className="alert-text"
            />
          }
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
                  <Col span={RIGHT}><span className="withdraw-addr">{record.lockTime}{intl.get('Common.days')}</span></Col>
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
              <div>
                <div className="withdraw-line">
                  <Row type="flex" justify="space-around" align="middle">
                    <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.maxFeeRate')}</span></Col>
                    <Col span={RIGHT}><span className="withdraw-addr">{record.maxFeeRate}</span></Col>
                  </Row>
                </div>
                <div className="withdraw-line">
                  <Row type="flex" justify="space-around" align="middle">
                    <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                    <Col span={RIGHT}><span className="withdraw-addr">{record.feeRate}</span></Col>
                  </Row>
                </div>
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
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('Common.amount')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{formatNum(record.amount)} WAN</span></Col>
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
