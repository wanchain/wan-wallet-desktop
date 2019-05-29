import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col } from 'antd';
import Validator from '../Validators/Validator';
import './index.less';
import validatorImg from 'static/image/validator.png';
import intl from 'react-intl-universal';

@inject(stores => ({
  getAddrList: stores.wanAddress.getAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
}))

@observer
class WithdrawForm extends Component {
  constructor(props) {
    super(props)
  }

  componentWillUnmount() {

  }

  onSend = () => {

    let from = this.props.record.accountAddress;

    const { ledgerAddrList, trezorAddrList } = this.props;

    const WALLET_ID_NATIVE = 0x01;   // Native WAN HD wallet
    const WALLET_ID_LEDGER = 0x02;
    const WALLET_ID_TREZOR = 0x03;
    
    let walletID = WALLET_ID_NATIVE;

    for (let i = 0; i < ledgerAddrList.length; i++) {
      const hdAddr = ledgerAddrList[i].address;
      if (hdAddr.toLowerCase() == from.toLowerCase()) {
        walletID = WALLET_ID_LEDGER
        break;
      }
    }

    for (let i = 0; i < trezorAddrList.length; i++) {
      const hdAddr = trezorAddrList[i].address;
      if (hdAddr.toLowerCase() == from.toLowerCase()) {
        walletID = WALLET_ID_TREZOR
        break;
      }
    }

    let tx = {
      "from": this.props.record.accountAddress,
      "validator": this.props.record.validator.address,
      "path": this.props.record.accountPath,
      "walletID": walletID,
    }

    if(walletID == 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }

    wand.request('staking_delegateOut', tx, (err, ret) => {
      if (err) {
        message.warn("Estimate gas failed. Please try again");
      } else {
        console.log('delegateOut ret:', ret);
      }
    });

    this.props.onSend()
  }

  render() {
    return (
      <div className="withdraw">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={intl.get('WithdrawForm.title')}
          onCancel={this.props.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.onSend}>{intl.get('SendNormalTrans.send')}</Button>,
          ]}
          className="withdraw-modal"
        >
          <div className="withdraw-bg">
            <div className="withdraw-title">Validator's Account:</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.name')}</span></Col>
                <Col span={18}><Validator img={this.props.record.validator.img} name={this.props.record.validator.name} /></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{this.props.record.validator.address}</span></Col>
              </Row>
            </div>
          </div>
          <div className="withdraw-bg">
            <div className="withdraw-title">{intl.get('StakeInForm.myAccount')}</div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.stake')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{this.props.record.myStake.title} WAN</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.balance')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{this.props.record.balance} WAN</span></Col>
              </Row>
            </div>
            <div className="withdraw-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={6}><span className="withdraw-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={18}><span className="withdraw-addr">{this.props.record.accountAddress}</span></Col>
              </Row>
            </div>
          </div>
          <p className="withdraw-note">{intl.get('WithdrawForm.note')}</p>
        </Modal>
      </div>
    );
  }
}

export default WithdrawForm;