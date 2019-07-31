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
import { WANPATH, WALLETID } from 'utils/settings'

const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
}))

@observer
class InForm extends Component {
  state = {
    confirmVisible: false,
    confirmLoading: false,
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
    this.setState({
      confirmLoading: true
    });
    let { form, record, addrInfo } = this.props;
    let from = record.myAddress.addr;
    let type = record.myAddress.type;
    let amount = form.getFieldValue('amount');
    let path = type === 'normal' ? WANPATH + addrInfo[type][from].path : addrInfo[type][from].path;
    let walletID = type !== 'normal' ? WALLETID[type.toUpperCase()] : WALLETID.NATIVE;

    let tx = {
      from: from,
      amount: amount.toString(),
      BIP44Path: path,
      walletID: walletID,
      minerAddr: record.validator.address
    }

    if (WALLETID.TREZOR === walletID) {
      // await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
      // this.setState({ confirmVisible: false });
      // this.props.onSend(walletID);
    } else {
      if(walletID === WALLETID.LEDGER) {
        message.info(intl.get('Ledger.signTransactionInLedger'))
      }
      wand.request('staking_validatorAppend', { tx }, (err, ret) => {
        if (err) {
          message.warn(err.message);
        } else {
          console.log('validatorIn ret:', ret);
        }
        this.setState({ confirmVisible: false });
        this.props.onSend();
      });
    }
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false, confirmLoading: false });
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
        { this.state.confirmVisible && <Confirm confirmLoading={this.state.confirmLoading} showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={formValues} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} /> }
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

  handleSend = () => {
    this.setState({ visible: false });
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.handleStateToggle} disabled={this.props.record.nextLockTime === 0}/>
        {this.state.visible && <ValidatorInForm onCancel={this.handleStateToggle} onSend={this.handleSend} record={this.props.record} />}
      </div>
    );
  }
}

export default ValidatorIn;