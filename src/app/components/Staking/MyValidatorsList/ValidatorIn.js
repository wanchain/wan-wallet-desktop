import BigNumber from 'bignumber.js';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message } from 'antd';
import { checkAmountUnit } from 'utils/helper';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';
import { WALLET_ID_NATIVE, WANPATH } from 'utils/settings'

const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);
const WALLET_ID_LEDGER = 0x02;
const WALLET_ID_TREZOR = 0x03;

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
}))

@observer
class InForm extends Component {
  state = {
    confirmVisible: false,
  };

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
  }

  checkAmount = (rule, value, callback) => {
    let { form } = this.props;
    let balance = form.getFieldValue('balance');
    if (value === undefined || !checkAmountUnit(18, value)) {
      callback(intl.get('NormalTransForm.invalidAmount'));
    }
    if (new BigNumber(value).lt(0)) {
      callback(intl.get('StakeInForm.stakeTooLow'));
      return;
    }
    if (new BigNumber(value).minus(balance).gte(0)) {
      callback(intl.get('SendNormalTrans.hasBalance'));
      return;
    }
    callback();
  }

  showConfirmForm = () => {
    let { form, settings, record, addrInfo } = this.props;
    let balance = addrInfo[record.myAddress.type][record.myAddress.addr].balance;
    form.validateFields(err => {
      if (err) return;
      if (new BigNumber(balance).minus(form.getFieldValue('amount')).lte(0)) {
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

  onSend = () => {
    let { form, record, addrInfo } = this.props;
    let from = record.myAddress.addr;
    let type = record.myAddress.type;
    let amount = form.getFieldValue('amount');
    let path = type === 'normal' ? WANPATH + addrInfo[type][from].path : addrInfo[type][from].path;
    let walletID = type !== 'normal' ? eval(`WALLET_ID_${type.toUpperCase()}`) : WALLET_ID_NATIVE;

    let tx = {
      from: from,
      amount: amount.toString(),
      BIP44Path: path,
      walletID: walletID,
      minerAddr: record.validator.address
    }

    if (WALLET_ID_TREZOR === walletID) {
      // await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
      // this.setState({ confirmVisible: false });
      // this.props.onSend(walletID);
    } else {
      wand.request('staking_validatorAppend', { tx }, (err, ret) => {
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

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  render() {
    const { onCancel, form, settings, record, addrInfo } = this.props;
    let showConfirmItem = { validatorAccount: true, myAddr: true, amount: true };
    let formValues = { publicKey1: record.publicKey1, myAddr: record.myAccount, amount: form.getFieldValue('amount') };

    return (
      <div className="stakein">
        <Modal visible closable={false} destroyOnClose={true} title={intl.get('ValidatorRegister.topup')} className="validator-register-modal"
        footer={[
            <Button key="back" className="cancel" onClick={onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.showConfirmForm}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.validatorAccount')}</div>
            <CommonFormItem form={form} formName='validatorAccount' disabled={true}
              options={{ initialValue: record.validator.address, rules: [{ required: true }] }}
              title={intl.get('ValidatorRegister.validatorAccount')}
            />
          </div>
          <div className="validator-bg">
            <div className="stakein-title">{intl.get('ValidatorRegister.myAccount')}</div>
            <CommonFormItem form={form} formName='myAccount' disabled={true}
              options={{ initialValue: record.myAccount }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.address')}
            />
            <CommonFormItem form={form} formName='balance' disabled={true}
              options={{ initialValue: addrInfo[record.myAddress.type][record.myAddress.addr].balance }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.balance')}
            />
            <CommonFormItem form={form} formName='amount'
              options={{ initialValue: 100, rules: [{ required: true, validator: this.checkAmount }] }}
              prefix={<Icon type="credit-card" className="colorInput" />}
              title={intl.get('ValidatorRegister.entrustedAmount')}
            />
            { settings.reinput_pwd && <PwdForm form={form}/> }
          </div>
        </Modal>
        { this.state.confirmVisible && <Confirm showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={formValues} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} /> }
      </div>
    );
  }
}

const ValidatorInForm = Form.create({ name: 'InForm' })(InForm);
class ValidatorIn extends Component {
  state = {
    visible: false
  }

  handleStateToggle = () => {
    this.setState(state => ({ visible: !state.visible }));
  }

  handleSend = walletID => {
    this.setState({ visible: false });
    if(walletID === 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'))
    }
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.handleStateToggle} />
        {this.state.visible && <ValidatorInForm onCancel={this.handleStateToggle} onSend={this.handleSend} record={this.props.record} />}
      </div>
    );
  }
}

export default ValidatorIn;