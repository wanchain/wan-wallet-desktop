import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { BigNumber } from 'bignumber.js';
import TrezorConnect from 'trezor-connect';
import { observer, inject } from 'mobx-react';
import { checkAmountUnit, getValueByAddrInfo, checkMaxFeeRate } from 'utils/helper';
import { isNumber } from 'utils/support';
import { Button, Modal, Form, Icon, message, Row, Col, Slider, Radio } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import AddrSelectForm from 'componentUtils/AddrSelectForm';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';
import { MINDAYS, MAXDAYS, WALLETID } from 'utils/settings'

const WanTx = require('wanchainjs-tx');
const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);

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
    lockTime: MINDAYS,
    isAgency: true,
    initAmount: 50000,
    confirmLoading: false,
  };

  componentWillUnmount () {
    this.setState = (state, callback) => {
      return false;
    };
  }

  handleSelectAgency = e => {
    this.setState({
      isAgency: e.target.value,
      initAmount: e.target.value ? 50000 : 10000
    });
  }

  getValueByAddrInfoArgs = (...args) => {
    return getValueByAddrInfo(...args, this.props.addrInfo);
  }

  onChangePosAddrSelect = value => {
    this.setState(() => {
      let balance = value ? this.getValueByAddrInfoArgs(value, 'balance') : 0;
      return { balance }
    })
  }

  checkPublicKey = (rule, value, callback) => {
    if (value === undefined) {
      callback(intl.get('ValidatorRegister.publicKeyIsWrong'));
      return;
    }
    if (value.startsWith('0x') && [130, 132].includes(value.length)) {
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
    if (new BigNumber(value).minus(10000).lt(0)) {
      callback(intl.get('ValidatorRegister.stakeTooLow'));
      return;
    }
    if (new BigNumber(value).minus(balance).gte(0)) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    callback();
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;
      if (new BigNumber(this.state.balance).minus(form.getFieldValue('amount')).lte(0)) {
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
    this.setState({ confirmVisible: false, confirmLoading: false });
  }

  onSend = async () => {
    this.setState({
      confirmLoading: true
    })
    let { form } = this.props;
    let to = form.getFieldValue('to');
    let from = form.getFieldValue('myAddr');
    let amount = form.getFieldValue('amount');
    let path = this.getValueByAddrInfoArgs(from, 'path');
    let walletID = from.indexOf(':') !== -1 ? WALLETID[from.split(':')[0].toUpperCase()] : WALLETID.NATIVE;
    let maxFeeRate = form.getFieldValue('maxFeeRate') === undefined ? 100 : form.getFieldValue('maxFeeRate');
    let feeRate = form.getFieldValue('feeRate') === undefined ? 100 : form.getFieldValue('feeRate');

    let tx = {
      from: from.indexOf(':') === -1 ? from : from.split(':')[1].trim(),
      amount: amount.toString(),
      BIP44Path: path,
      walletID: walletID,
      secPk: form.getFieldValue('publicKey1'),
      bn256Pk: form.getFieldValue('publicKey2'),
      lockEpoch: (form.getFieldValue('lockTime') * 24 * 3600) / (global.slotCount * global.slotTime),
      maxFeeRate: Math.round(maxFeeRate * 100),
      feeRate: Math.round(feeRate * 100),
    }
    if (walletID === WALLETID.LEDGER) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
    if (WALLETID.TREZOR === walletID) {
      await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
      this.setState({ confirmVisible: false });
      this.props.onSend(walletID);
    } else {
      wand.request('staking_registerValidator', { tx }, (err, ret) => {
        if (err) {
          message.warn(err.message);
        }
        this.setState({ confirmVisible: false, confirmLoading: false });
        this.props.onSend();
      });
    }
  }

  checkFeeRate = (rule, value, callback) => {
    let { form } = this.props;
    let maxFee = form.getFieldValue('maxFeeRate') || 0;
    try {
      if (!isNumber(value) || Number(value) > Number(maxFee)) {
        callback(intl.get('NormalTransForm.invalidFeeRate'));
      }
      checkMaxFeeRate(rule, value, callback);
    } catch (err) {
      callback(intl.get('NormalTransForm.invalidFeeRate'));
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
      let eTx = new WanTx(tx);
      let signedTx = '0x' + eTx.serialize().toString('hex');
      console.log('signed', signedTx);
      console.log('tx:', tx);
      callback(null, signedTx);
    });
  }

  onSliderChange = value => {
    this.setState({ lockTime: value })
  }

  render () {
    const { form, settings, addrSelectedList, onCancel } = this.props;
    const { getFieldDecorator } = form;
    let record = form.getFieldsValue(['publicKey1', 'publicKey2', 'lockTime', 'maxFeeRate', 'feeRate', 'myAddr', 'amount']);
    let showConfirmItem = { publicKey1: true, publicKey2: true, validatorAccount: true, lockTime: true, feeRate: this.state.isAgency, myAddr: true, amount: true, acceptDelegation: true };

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
            <CommonFormItem form={form} formName='publicKey1'
              options={{ rules: [{ required: true, validator: this.checkPublicKey }] }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title={intl.get('ValidatorRegister.publicKey1')}
              placeholder={intl.get('ValidatorRegister.enterSecPk')}
            />
            <CommonFormItem form={form} formName='publicKey2'
              options={{ rules: [{ required: true, validator: this.checkPublicKey }] }}
              prefix={<Icon type="wallet" className="colorInput" />}
              title={intl.get('ValidatorRegister.publicKey2')}
              placeholder={intl.get('ValidatorRegister.enterG1Pk')}
            />
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={8}><span className="stakein-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                <Col span={13}>
                  <Form layout="inline">
                    <Form.Item>
                      {getFieldDecorator('lockTime', { initialValue: MINDAYS, rules: [{ required: true }] })
                        (<Slider className='locktime-slider' min={MINDAYS} max={MAXDAYS} step={1} onChange={this.onSliderChange} />)}
                    </Form.Item>
                  </Form>
                </Col>
                <Col span={3}><span className="locktime-span">{this.state.lockTime} {intl.get('days')}</span></Col>
              </Row>
            </div>
            <div className="validator-line">
              <Row type="flex" justify="space-around" align="top">
                <Col span={8}><span className="stakein-name">{intl.get('ValidatorRegister.agency')}</span></Col>
                <Col span={16}>
                  <Form layout="inline">
                    <Form.Item>
                      <Radio.Group onChange={this.handleSelectAgency} value={this.state.isAgency}>
                        <Radio value={true}>{intl.get('ValidatorRegister.acceptAgency')}</Radio>
                        <Radio value={false}>{intl.get('ValidatorRegister.notAcceptAgency')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </div>
            {
              this.state.isAgency &&
              <div>
                <CommonFormItem form={form} formName='maxFeeRate'
                  options={{ rules: [{ required: true, validator: checkMaxFeeRate }] }}
                  title={intl.get('ValidatorRegister.maxFeeRate')}
                  placeholder={intl.get('ValidatorRegister.feeRateLimit')}
                />
                <CommonFormItem form={form} formName='feeRate'
                  options={{ rules: [{ required: true, validator: this.checkFeeRate }] }}
                  title={intl.get('ValidatorRegister.feeRate')}
                  placeholder={intl.get('ValidatorRegister.feeRateLimit')}
                />
              </div>
            }
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <div className="validator-line">
              <AddrSelectForm form={form} addrSelectedList={addrSelectedList} handleChange={this.onChangePosAddrSelect} getValueByAddrInfoArgs={this.getValueByAddrInfoArgs} />
            </div>
            <CommonFormItem form={form} formName='balance' disabled={true}
              options={{ initialValue: this.state.balance }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.balance')}
            />
            <CommonFormItem form={form} formName='amount'
              options={{ initialValue: this.state.initAmount, rules: [{ required: true, validator: this.checkAmount }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.entrustedAmount')}
            />
            {settings.reinput_pwd && <PwdForm form={form} />}
          </div>
        </Modal>
        {this.state.confirmVisible && <Confirm confirmLoading={this.state.confirmLoading} showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={Object.assign(record, { acceptDelegation: this.state.isAgency })} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} />}
      </div>
    );
  }
}

export default ValidatorRegister;
