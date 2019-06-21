import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Icon, Select, InputNumber, message, Row, Col, Avatar, Slider } from 'antd';
import './index.less';
import { checkWanValidatorAddr } from 'utils/helper';
import StakeConfirmForm from '../StakeConfirmForm';
const Confirm = Form.create({ name: 'StakeConfirmForm' })(StakeConfirmForm);

import intl from 'react-intl-universal';
const wanTx = require('wanchainjs-tx');
import TrezorConnect from 'trezor-connect';
const pu = require('promisefy-util')
import { getNonce, getGasPrice, checkAmountUnit, getChainId, getContractData } from 'utils/helper';
import { toWei } from 'utils/support.js';
import Notice from './Notice';


const Option = Select.Option;

@inject(stores => ({
  settings: stores.session.settings,
  getAddrList: stores.wanAddress.getAddrList,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  onlineValidatorList: stores.staking.onlineValidatorList,
  updateStakeInfo: () => stores.staking.updateStakeInfo(),
  updateTransHistory: () => stores.wanAddress.updateTransHistory(),
}))

@observer
class ValidatorUpdate extends Component {
  constructor(props) {
    super(props)
    this.state = {
      balance: "0",
      addrList: [],
      confirmVisible: false,
      locktime: 0,
      noticeVisbile: true,
      record: {
        validator: {},
        accountAddress: '',
        myStake: { title: '' },
      }
    }
  }

  componentWillMount() {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    let addrList = []
    getAddrList.forEach(addr => {
      addrList.push(
        addr.address
      )
    });

    ledgerAddrList.forEach(addr => {
      addrList.push(
        'Ledger: ' + addr.address
      )
    });

    trezorAddrList.forEach(addr => {
      addrList.push(
        'Trezor: ' + addr.address
      )
    });

    this.setState({ addrList: addrList })
  }

  getBalance = (value) => {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    if (!value) {
      return
    }

    if (value.includes('Ledger')) {
      for (let i = 0; i < ledgerAddrList.length; i++) {
        const element = ledgerAddrList[i];
        value = value.replace('Ledger: ', '')
        if (element.address == value) {
          return element.balance;
        }
      }
      return;
    }

    if (value.includes('Trezor')) {
      for (let i = 0; i < trezorAddrList.length; i++) {
        const element = trezorAddrList[i];
        value = value.replace('Trezor: ', '')
        if (element.address == value) {
          return element.balance;
        }
      }
      return;
    }

    for (let i = 0; i < getAddrList.length; i++) {
      const element = getAddrList[i];
      if (element.address == value) {
        return element.balance;
      }
    }
  }

  onChange = value => {
    if (!value) {
      return
    }

    this.setState({
      balance: this.getBalance(value),
    })
  }

  checkValidatorAddr = (rule, value, callback) => {
    callback();
  }

  checkAmount = (rule, value, callback) => {
    let { form } = this.props;
    let quota = form.getFieldValue('quota');
    let balance = form.getFieldValue('balance');

    if (!checkAmountUnit(18, value)) {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }

    if (Number(value) < 10000) {
      callback(intl.get('StakeInForm.stakeTooLow'));
      return;
    }

    if (Number(value) > Number(balance)) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }

    if (Number(value) > Number(quota)) {
      callback(intl.get('StakeInForm.stakeExceed'));
      return;
    }

    callback();
  }

  getPath = (from) => {
    const { getAddrList, ledgerAddrList, trezorAddrList } = this.props;
    let addrs = getAddrList
    let fromAddr = from

    if (from.includes('Ledger')) {
      fromAddr = from.replace('Ledger: ', '')
      addrs = ledgerAddrList
    }

    if (from.includes('Trezor')) {
      fromAddr = from.replace('Trezor: ', '')
      addrs = trezorAddrList
    }

    for (let i = 0; i < addrs.length; i++) {
      const addr = addrs[i];
      if (addr.address == fromAddr) {
        return addr.path;
      }
    }
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(async (err) => {
      if (err) return;

      let from = form.getFieldValue('from');
      let to = form.getFieldValue('to');
      let pwd = form.getFieldValue('pwd');

      if (Number(this.state.balance) <= amount) {
        message.error(intl.get('NormalTransForm.overBalance'))
        return;
      }

      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }

        try {
          await pu.promisefy(wand.request, ['phrase_reveal', { pwd: pwd }], this);
        } catch (error) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
      }

      this.setState({
        confirmVisible: true,
      });
    })
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  onNoticeCancel = () => {
    this.setState({ noticeVisible: false });
  }

  onSend = async () => {

    let { form } = this.props;
    let from = form.getFieldValue('from');
    let to = form.getFieldValue('to');

    let path = this.getPath(from);

    let amount = form.getFieldValue('amount');
    if (!amount || amount < 100) {
      message.error("Please input a valid amount.");
      return;
    }

    if (this.state.balance <= amount) {
      message.error("Balance is not enough.")
      return;
    }

    const WALLET_ID_NATIVE = 0x01;   // Native WAN HD wallet
    const WALLET_ID_LEDGER = 0x02;
    const WALLET_ID_TREZOR = 0x03;

    let walletID = WALLET_ID_NATIVE;

    if (from.includes('Ledger')) {
      from = from.replace('Ledger: ', '')
      walletID = WALLET_ID_LEDGER;
    }

    if (from.includes('Trezor')) {
      from = from.replace('Trezor: ', '')
      walletID = WALLET_ID_TREZOR;
    }

    let tx = {
      "from": from,
      "validatorAddr": to,
      "amount": (form.getFieldValue('amount') || 0).toString(),
      "gasPrice": 0,
      "gasLimit": 0,
      "BIP44Path": path,
      "walletID": walletID
    }

    // if (walletID == WALLET_ID_TREZOR) {
    //   await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
    //   this.props.onSend(walletID);
    // } else {
    //   wand.request('staking_delegateIn', tx, (err, ret) => {
    //     if (err) {
    //       message.warn(err.message);
    //     } else {
    //       console.log('delegateIn ret:', ret);
    //     }
    //   });
    // }

    this.setState({ confirmVisible: false });

    this.props.onSend(walletID);
  }


  trezorDelegateIn = async (path, from, validator, value) => {
    console.log('trezorDelegateIn:', path, from, validator, value);
  }

  signTrezorTransaction = (path, tx, callback) => {
    console.log('signTrezorTransaction:', path, tx);
    TrezorConnect.ethereumSignTransaction({
      path: path,
      transaction: {
        to: tx.to,
        value: tx.value,
        data: tx.data,
        chainId: tx.chainId,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        txType: tx.Txtype, // Txtype case is required by wanTx
      },
    }).then((result) => {
      console.log('signTrezorTransaction result:', result);

      if (!result.success) {
        message.warn(intl.get('Trezor.signTransactionFailed'));
        callback(intl.get('Trezor.signFailed'), null);
        return;
      }

      tx.v = result.payload.v;
      tx.r = result.payload.r;
      tx.s = result.payload.s;
      let eTx = new wanTx(tx);
      let signedTx = '0x' + eTx.serialize().toString('hex');
      console.log('signed', signedTx);
      console.log('tx:', tx);
      callback(null, signedTx);
    });
  }

  onSliderChange = (value)=>{
    this.setState({locktime: value})
  }

  checkLockTime = (rule, value, callback) => {
    if (value != 0 && value < 14) {
      callback('Invalid Value. Must > 14 or == 0')
    }
    callback();
  }

  render() {
    let { onlineValidatorList, form, settings } = this.props;

    let validatorListSelect = []
    for (let i = 0; i < onlineValidatorList.length; i++) {
      const v = onlineValidatorList[i];
      validatorListSelect.push(
        (<div name={v.name}><Avatar src={v.icon} name={v.name} value={v.name} size="small" />{" "}{v.name}</div>)
      )
    }

    const { getFieldDecorator } = form;

    let left = 8;
    let right = 16;

    return (
      <div className="stakein">
        <Modal
          visible
          destroyOnClose={true}
          closable={false}
          title={intl.get('staking.validatorUpdate')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.props.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
          className="validator-register-modal"
        >
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('StakeInForm.validatorAccount')}</div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={left}><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={right}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('to', { rules: [{ required: true, validator: this.checkValidatorAddr }] })
                        (<Input placeholder={intl.get('StakeInForm.enterAddress')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={left}><span className="stakein-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                <Col span={right-4}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('lockTime', { rules: [{ required: true, validator: this.checkLockTime }] })
                        (<Slider className='locktime-slider' min={0} max={180} step={2} onChange={this.onSliderChange}/>)}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={4} align="left"><span className="locktime-span">{this.state.locktime} days</span></Col>
                
              </Row>
            </div>
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('StakeInForm.myAccount')}</div>

            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={left}><span className="stakein-name">{intl.get('StakeInForm.address')}</span></Col>
                <Col span={right}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('from', { rules: [{ required: true, message: intl.get('NormalTransForm.invalidAddress') }] })
                        (
                          <Select
                            showSearch
                            allowClear
                            style={{ width: 470 }}
                            placeholder={intl.get('StakeInForm.selectAddress')}
                            optionFilterProp="children"
                            onChange={this.onChange}
                            onSelect={this.onChange}
                            onFocus={this.onFocus}
                            onBlur={this.onBlur}
                            onSearch={this.onSearch}
                            filterOption={(input, option) => option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                            className="colorInput"
                          >
                            {this.state.addrList.map((item, index) => <Option value={item} key={index}>
                              <Row>
                                <Col span={16}>{item}</Col>
                                <Col span={8} align="right" className="stakein-selection-balance">{'Balance: '}{Number(this.getBalance(item)).toFixed(1)}</Col>
                              </Row>
                            </Option>)}
                          </Select>
                        )}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>

            <div className="validator-line">
              <Row type="flex" justify="space-around" align="middle">
                <Col span={left}><span className="stakein-name">{intl.get('StakeInForm.balance')}</span></Col>
                <Col span={right}>
                  <Form layout="inline">
                    <Form.Item >
                      {getFieldDecorator('balance', { initialValue: this.state.balance })
                        (<Input disabled={true} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            {settings.reinput_pwd
              ? <div className="validator-line">
                <Row type="flex" justify="space-around" align="middle">
                  <Col span={left}><span className="stakein-name">{intl.get('NormalTransForm.password')}</span></Col>
                  <Col span={right}>
                    <Form layout="inline">
                      <Form.Item>
                        {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                          (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </div>
              : ''
            }

          </div>
          <p className="withdraw-note">{intl.get('ValidatorUpdate.note')}</p>
        </Modal>

        {/* {
          this.state.noticeVisbile?
          (<Notice onCancel={this.onNoticeCancel} note={''} />) : ''
        } */}

        {
          this.state.confirmVisible ?
            (<Confirm visible={this.state.confirmVisible}
              onCancel={this.onConfirmCancel} onSend={this.onSend}
              record={this.state.record}
              title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')}
              note={''}
            />) : ''
        }

      </div>
    );
  }
}

export default ValidatorUpdate;