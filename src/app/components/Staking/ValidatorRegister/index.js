import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import TrezorConnect from 'trezor-connect';
import { observer, inject } from 'mobx-react';
import { checkAmountUnit, getValueByAddrInfo } from 'utils/helper';
import { Button, Modal, Form, Input, Icon, Select, message, Row, Col, Slider } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';

const Option = Select.Option;
const wanTx = require('wanchainjs-tx');
const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);

const COLLEFT = 8;
const COLRIGHT = 16;
const MINDAYS = 7;
const MAXDAYS = 90;
const WALLET_ID_NATIVE = 0x01;
const WALLET_ID_LEDGER = 0x02;
const WALLET_ID_TREZOR = 0x03;

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
  addrSelectedList: stores.wanAddress.addrSelectedList,
}))

@observer
class ValidatorRegister extends Component {
  state = {
    balance: 0,
    confirmVisible: false,
    locktime: MINDAYS,
  };

  onChange = value => {
    this.setState((state, props) => {
      let balance = value ?  getValueByAddrInfo(value, 'balance', props.addrInfo) : 0;
      return { balance }
    })
  }

  checkPublicKey = (rule, value, callback) => {
    if(value === undefined) {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
      return;
    }
    if(value.startsWith('0x') && [130, 132].includes(value.length)) {
      callback();
    } else {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
    }
  }

  checkAmount = (rule, value, callback) => {
    let { form } = this.props;
    let balance = form.getFieldValue('balance');
    if (value === undefined || !checkAmountUnit(18, value)) {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }
    if (new BigNumber(value).minus(10000) < 0) {
      callback(intl.get('ValidatorRegister.stakeTooLow'));
      return;
    }
    if (new BigNumber(value).minus(balance) >= 0) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    callback();
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;
      if (new BigNumber(this.state.balance).minus(form.getFieldValue('amount')) <= 0) {
        message.error(intl.get('NormalTransForm.overBalance'));
        return;
      }

      let pwd = form.getFieldValue('pwd');
      if (!settings.reinput_pwd) {
        this.setState({ confirmVisible: true });
      } else {
        wand.request('phrase_reveal', { pwd }, err => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            this.setState({ confirmVisible: true });
          }
        })
      }

    })
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  onSend = async () => {
    let { form, addrInfo } = this.props;
    let to = form.getFieldValue('to'), 
        from = form.getFieldValue('myAddr'), 
        amount = form.getFieldValue('amount');
    let path = getValueByAddrInfo(from, 'path', addrInfo);
    let walletID = from.indexOf(':') !== -1 ? `${`WALLET_ID_${form.split(':')[0].toUpperCase()}`}` : WALLET_ID_NATIVE;

    let tx = {
      from: from,
      amount: amount.toString(),
      BIP44Path: path,
      walletID: walletID,
      secpub: form.getFieldValue('publicKey1'),
      g1pub: form.getFieldValue('publicKey2'),
      lockTime: form.getFieldValue('lockTime'),
      feeRate: form.getFieldValue('feeRate') * 100,
    }
    if (WALLET_ID_TREZOR === walletID) {
      await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
      this.setState({ confirmVisible: false });
      this.props.onSend(walletID);
    } else {
      wand.request('staking_registValidator', { tx }, (err, ret) => {
        if (err) {
          message.warn(err.message);
        } else {
          console.log('delegateIn ret:', ret);
        }
        this.setState({ confirmVisible: false });
        this.props.onSend(walletID);
      });
    }
  }

  trezorDelegateIn = async (path, from, validator, value) => {
    console.log('trezorDelegateIn:', path, from, validator, value);
  }

  signTrezorTransaction = (path, tx, callback) => {
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

  onSliderChange = value => {
    this.setState({locktime: value})
  }

  render() {
    const { form, settings, addrSelectedList, onCancel, addrInfo } = this.props;
    const { getFieldDecorator } = form;
    const record = form.getFieldsValue(['publicKey1', 'publicKey2', 'lockTime', 'feeRate', 'myAddr', 'amount']);
    return (
      <div className="stakein">
        <Modal visible closable={false} destroyOnClose={true} title={intl.get('ValidatorRegister.verifyRegistration')} className="validator-register-modal"
          footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.validatorAccount')}</div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.publicKey1')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('publicKey1', { rules: [{ required: true, validator: this.checkPublicKey }] })
                        (<Input placeholder={intl.get('ValidatorRegister.enterSecPk')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.publicKey2')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('publicKey2', { rules: [{ required: true, validator: this.checkPublicKey }] })
                        (<Input placeholder={intl.get('ValidatorRegister.enterG1Pk')} prefix={<Icon type="wallet" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                <Col span={COLRIGHT-4}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('lockTime', { initialValue: MINDAYS, rules: [{ required: true }] })
                        (<Slider className='locktime-slider' min={MINDAYS} max={MAXDAYS} step={1} onChange={this.onSliderChange}/>)}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={4}><span className="locktime-span">{this.state.locktime} days</span></Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.feeRate')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('feeRate', { rules: [{ required: true }] })
                        (<Input placeholder={'10.00'} prefix={<Icon type="percentage" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.address')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline" id="posAddrSelect">
                    <Form.Item>
                      {getFieldDecorator('myAddr', { rules: [{ required: true, message: intl.get('NormalTransForm.invalidAddress') }] })
                        (
                          <Select
                            autoFocus
                            showSearch
                            allowClear
                            className="colorInput"
                            optionLabelProp="value"
                            optionFilterProp="children"
                            dropdownStyle={{width: "470px"}}
                            dropdownMatchSelectWidth={false}
                            placeholder={intl.get('StakeInForm.selectAddress')}
                            onChange={this.onChange}
                            getPopupContainer={() => document.getElementById('posAddrSelect')}
                            filterOption={(input, option) => option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                          >
                            {
                              addrSelectedList.map((item, index) =>
                              <Option value={item} key={index}>
                                <Row>
                                  <Col span={20}>{item}</Col>
                                  <Col span={4} align="right" className="stakein-selection-balance">- {Number(getValueByAddrInfo(item, 'balance', addrInfo)).toFixed(1)}</Col>
                                </Row>
                              </Option>)
                            }
                          </Select>
                        )}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.balance')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline">
                    <Form.Item >
                      {getFieldDecorator('balance', { initialValue: this.state.balance })
                        (<Input disabled={true} prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={COLLEFT}><span className="stakein-name">{intl.get('ValidatorRegister.entrustedAmount')}</span></Col>
                <Col span={COLRIGHT}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('amount', { initialValue: 10000, rules: [{ required: true, validator: this.checkAmount }] })
                        (<Input prefix={<Icon type="credit-card" className="colorInput" />} />)}
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            { settings.reinput_pwd && <PwdForm form={form}/> }
          </div>
        </Modal>
        { this.state.confirmVisible && <Confirm onCancel={this.onConfirmCancel} onSend={this.onSend} record={record} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} /> }
      </div>
    );
  }
}

export default ValidatorRegister;