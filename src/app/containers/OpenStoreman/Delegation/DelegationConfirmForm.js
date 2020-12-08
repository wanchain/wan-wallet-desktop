import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Row, Col, Alert } from 'antd';
import { formatNum, formatLongText } from 'utils/support';

import 'components/Staking/ValidatorConfirmForm/index.less';

const LEFT = 8;
const RIGHT = 16;

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class DelegationConfirmForm extends Component {
  render () {
    const { onCancel, record, onSend, title, showConfirmItem, confirmLoading } = this.props;
    const { delegationFee, crosschain, groupId, account, amount, storeman, withdrawable } = showConfirmItem;

    return (
      <div className="withdraw">
        <Modal visible destroyOnClose={true} closable={false} title={title} onCancel={onCancel} className="withdraw-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button loading={!!confirmLoading} key="submit" type="primary" onClick={onSend}>{intl.get('Common.send')}</Button>,
          ]}
        >
          {
            this.props.type === 'delegateIn' &&
            <Alert
              message={intl.get('Storeman.delegationWarnning')}
              type="warning"
              closable
              className="alert-text"
            />
          }
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('Storeman.storemanAccount')}</div>
            {
              crosschain &&
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('Common.crossChain')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.crosschain}</span></Col>
                </Row>
              </div>
            }
            {
              storeman &&
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('Common.storeman')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.wkAddr}</span></Col>
                </Row>
              </div>
            }
            {
              groupId &&
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('Storeman.group')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.groupIdName}</span></Col>
                </Row>
              </div>
            }
            {
              delegationFee &&
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.delegationFee}</span></Col>
                </Row>
              </div>
            }
            {
              withdrawable &&
              <div className="withdraw-line key-style">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('staking.unclaimAmount')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.unclaimedData}</span></Col>
                </Row>
              </div>
            }
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('ValidatorRegister.myAccount')}</div>
            {
              account &&
              <div className="withdraw-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={LEFT}><span className="withdraw-name">{intl.get('ValidatorRegister.address')}</span></Col>
                  <Col span={RIGHT}><span className="withdraw-addr">{record.account}</span></Col>
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

export default DelegationConfirmForm;
