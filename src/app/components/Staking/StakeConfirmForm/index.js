import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Row, Col, Avatar } from 'antd';

import style from './index.less';
import { formatNum } from 'utils/support';

@inject(stores => ({
  settings: stores.session.settings,
}))

@observer
class StakeConfirmForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      title: props.title,
      note: props.note,
    }
  }

  onSend = () => {
    this.props.onSend()
  }

  render () {
    return (
      <div className="withdraw">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={this.state.title}
          onCancel={this.props.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.onSend} loading={!!this.props.confirmLoading}>{intl.get('Common.send')}</Button>,
          ]}
          className="withdraw-modal"
        >
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('StakeInForm.validatorAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('StakeInForm.name')}</span></Col>
                <Col span={14}>
                  {/* <Validator img={this.props.record.validator.img} name={this.props.record.validator.name} /> */}
                  <div><Avatar src={this.props.record.validator.img}/>{' '}{this.props.record.validator.name}</div>
                  </Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{this.props.record.validator.address}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('ValidatorRegister.maxFeeRate')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{this.props.record.validator.maxFeeRate}</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{this.props.record.validator.commission}</span></Col>
              </Row>
            </div>
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('StakeInForm.myAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('StakeInForm.stake')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{formatNum(this.props.record.myStake.title)} WAN</span></Col>
              </Row>
            </div>
            {/* <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('StakeInForm.balance')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{this.props.record.balance} WAN</span></Col>
              </Row>
            </div> */}
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={10}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={14}><span className="withdraw-addr">{this.props.record.accountAddress}</span></Col>
              </Row>
            </div>
          </div>
          <p className="withdraw-note">{this.state.note}</p>
        </Modal>
      </div>
    );
  }
}

export default StakeConfirmForm;
