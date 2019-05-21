import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col } from 'antd';
import Validator from '../Validators/Validator';
import './index.less';
import validatorImg from 'static/image/validator.png';


class WithdrawForm extends Component {
  constructor(props) {
    super(props)
  }

  componentWillUnmount() {

  }

  render() {
    return (
      <div className="withdraw">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title="Register to Withdraw"
          onCancel={this.props.onCancel}
          footer={[
            <Button key="submit" type="primary" onClick={this.props.onSend}>Send</Button>,
            <Button key="back" className="cancel" onClick={this.props.onCancel}>Cancel</Button>,
          ]}
        >
          <div className="withdraw-bg">
            <div className="withdraw-title">Validator's Account:</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">Name</span></Col>
                <Col span={18}><Validator img={validatorImg} name="Ethereum" /></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">Address</span></Col>
                <Col span={18}><span className="withdraw-addr">0x9E872759a206320D46211493c738fDD7eb48fF29</span></Col>
              </Row>
            </div>
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">My Account:</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">Stake</span></Col>
                <Col span={18}><span className="withdraw-addr">20,000 WAN</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">Balance</span></Col>
                <Col span={18}><span className="withdraw-addr">20,000 WAN</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
              <Col span={6}><span className="withdraw-name">Address</span></Col>
                <Col span={18}><span className="withdraw-addr">0x9E872759a206320D46211493c738fDD7eb48fF29</span></Col>
              </Row>
            </div>
          </div>
          <p className="withdraw-note">Note: After registering for withdrawal, staking balance will go to zero and staked WAN will be
returned to your account within 3 epochs.</p>
        </Modal>
      </div>
    );
  }
}

export default WithdrawForm;