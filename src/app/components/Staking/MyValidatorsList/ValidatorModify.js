import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Row, Col, Slider } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ValidatorModifySelect from 'componentUtils/ValidatorModifySelect';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';
import { isNumber } from 'utils/support';
import { MINDAYS, MAXDAYS, WALLET_ID_NATIVE, WANPATH } from 'utils/settings'

const WALLET_ID_LEDGER = 0x02;
const WALLET_ID_TREZOR = 0x03;
const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);
const modifyTypes = {
  lockTime: 'ValidatorRegister.lockTime',
  feeRate: 'ValidatorRegister.feeRate'
}

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
}))

@observer
class ModifyForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectType: '',
      confirmVisible: false,
      lockTime: this.props.record.lockTime,
      showConfirmItem: {},
    }
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
  }

  showConfirmForm = () => {
    let { form, settings, modifyType } = this.props;
    form.validateFields(err => {
      if (err) return;
      if(modifyType === 'exit') {
        this.setState({ showConfirmItem: { validatorAccount: true, myAddr: true } })
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
    let { form, record, addrInfo, modifyType } = this.props;
    let from = record.myAddress.addr, type = record.myAddress.type;
    let walletID = type !== 'normal' ? eval(`WALLET_ID_${type.toUpperCase()}`) : WALLET_ID_NATIVE;
    let tx ={
      from: from,
      amount: 0,
      BIP44Path: type !== 'normal' ? addrInfo[type][from].path : WANPATH + addrInfo[type][from].path,
      walletID: walletID,
      minerAddr: record.validator.address
    };

    if(modifyType === 'exit' || this.state.selectType === Object.keys(modifyTypes).findIndex(val => val === 'lockTime').toString()) {
      Object.assign(tx, {
        lockTime: modifyType === 'exit' ? 0 : form.getFieldValue('lockTime'),
      })

      if (WALLET_ID_TREZOR === walletID) {
        // await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
        // this.setState({ confirmVisible: false });
        // this.props.onSend(walletID);
      } else {
        wand.request('staking_validatorUpdate', { tx }, (err, ret) => {
          if (err) {
            message.warn(err.message);
          } else {
            console.log('delegateIn ret:', ret);
          }
          this.props.onSend(walletID);
        });
      }
    }
    if(this.state.selectType === Object.keys(modifyTypes).findIndex(val => val === 'feeRate').toString()) {
      Object.assign(tx, {
        feeRate: form.getFieldValue('feeRate') * 100,
      })

      if (WALLET_ID_TREZOR === walletID) {
        // await this.trezorDelegateIn(path, from, to, (form.getFieldValue('amount') || 0).toString());
        // this.setState({ confirmVisible: false });
        // this.props.onSend(walletID);
      } else {
        wand.request('staking_getCurrentEpochInfo', null, (err, ret) => {
          if(err) {
            message.warn(err.message);
          } else {
            if(ret.epochId === record.feeRateChangedEpoch) {
              message.warn('不能在同一个EpochId里修改两次')
              return;
            }
            wand.request('staking_PosStakeUpdateFeeRate', { tx }, (err, ret) => {
              if (err) {
                message.warn(err.message);
              } else {
                console.log('PosStakeUpdateFeeRate ret:', ret);
              }
              this.props.onSend(walletID);
            });
          }
        })
      }
    }
  }

  onChangeModifyTypeSelect = (value, option) => {
    let showConfirmItem;
    if(Object.keys(modifyTypes)[option.key] === 'lockTime') {
      showConfirmItem = {validatorAccount: true, myAddr: true, lockTime: true}
    }
    if(Object.keys(modifyTypes)[option.key] === 'feeRate') {
      showConfirmItem = {validatorAccount: true, myAddr: true, feeRate: true}
    }
    this.setState(() => ({selectType: option.key, showConfirmItem}));
  }

  onSliderChange = value => {
    this.setState({ lockTime: value })
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  checkMaxFeeRate = (rule, value, callback) => {
    let { feeRate, maxFeeRate } = this.props.record;
    try {
      if(!isNumber(value)) {
        callback(intl.get('NormalTransForm.invalidFeeRate'));
        return;
      }
      if(value < 0 || value > maxFeeRate) {
        callback(intl.get('NormalTransForm.invalidFeeRate'));
        return;
      }
      if(value.toString().split('.')[1] && value.toString().split('.')[1].length > 2) {
        callback(intl.get('NormalTransForm.invalidFeeRate'));
        return;
      }
      if(value > feeRate && value > feeRate + 1) {
        callback(intl.get('NormalTransForm.invalidFeeRate'));
        return;
      }
      callback();
    } catch(err) {
      callback(intl.get('NormalTransForm.invalidFeeRate'));
    }
  }

  render() {
    const { onCancel, form, settings, record, addrInfo, modifyType } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    let formValues = { publicKey1: record.publicKey1, myAddr: record.myAccount, lockTime: getFieldValue('lockTime'), feeRate: getFieldValue('feeRate') };
    let title = modifyType === 'exit' ? intl.get('ValidatorRegister.exit') : intl.get('ValidatorRegister.verifyModification');
    let selectTypes = record.maxFeeRate === 100 ? [intl.get(`${modifyTypes.lockTime}`)] : [intl.get(`${modifyTypes.lockTime}`), intl.get(`${modifyTypes.feeRate}`)];

    return (
      <div className="stakein">
        <Modal visible closable={false} destroyOnClose={true} title={title} className="validator-register-modal"
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
            {
              modifyType === 'modify' &&
              <div className="validator-line">
                <ValidatorModifySelect
                  form={form}
                  types={selectTypes}
                  handleChange={this.onChangeModifyTypeSelect}
                  title={intl.get('ValidatorRegister.modifyTypeTitle')}
                  message={intl.get('ValidatorRegister.invalidType')}
                  placeholder={intl.get('ValidatorRegister.selectType')}
                />
              </div>
            }
            {
              modifyType === 'modify' && this.state.selectType === Object.keys(modifyTypes).findIndex(val => val === 'lockTime').toString() &&
              <React.Fragment>
                <CommonFormItem form={form} formName='currentLockTime' disabled={true}
                  options={{ initialValue: record.lockTime, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.currentLockTime')}
                />
                <CommonFormItem form={form} formName='nextLockTime' disabled={true}
                  options={{ initialValue: record.nextLockTime, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.nextLockTime')}
                />
                <div className="validator-line">
                  <Row type="flex" justify="space-around" align="top">
                    <Col span={8}><span className="stakein-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                    <Col span={13}>
                      <Form layout="inline">
                        <Form.Item>
                          {getFieldDecorator('lockTime', { initialValue: record.lockTime, rules: [{ required: true }] })
                            (<Slider className='locktime-slider' min={MINDAYS} max={MAXDAYS} step={1} onChange={this.onSliderChange} />)}
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col span={3}><span className="locktime-span">{getFieldValue('lockTime')} {intl.get('days')}</span></Col>
                  </Row>
                </div>
              </React.Fragment>
            }
            {
              modifyType === 'modify' && this.state.selectType === Object.keys(modifyTypes).findIndex(val => val === 'feeRate').toString() &&
              <React.Fragment>
                <CommonFormItem form={form} formName='maxFeeRate' disabled={true}
                  options={{ initialValue: record.maxFeeRate, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.maxFeeRate')}
                />
                <CommonFormItem form={form} formName='currentFeeRate' disabled={true}
                  options={{ initialValue: record.feeRate, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.currentFeeRate')}
                />
                <CommonFormItem form={form} formName='feeRate'
                  options={{ initialValue: record.feeRate, rules: [{ required: true, validator: this.checkMaxFeeRate }] }}
                  title={intl.get('ValidatorRegister.feeRate')}
                  placeholder={intl.get('ValidatorRegister.feeRateLimit')}
                />
              </React.Fragment>
            }
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
            {settings.reinput_pwd && <PwdForm form={form} />}
          </div>
        </Modal>
        {this.state.confirmVisible && <Confirm showConfirmItem={this.state.showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={formValues} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} />}
      </div>
    );
  }
}

const ValidatorModifyForm = Form.create({ name: 'ModifyForm' })(ModifyForm);
class ValidatorModify extends Component {
  state = {
    visible: false
  }

  handleStateToggle = () => {
    this.setState(state => ({ visible: !state.visible }));
  }

  handleSend = walletID => {
    this.setState({ visible: false });
    if (walletID === 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'));
    }
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.handleStateToggle} />
        {this.state.visible && <ValidatorModifyForm onCancel={this.handleStateToggle} onSend={this.handleSend} record={this.props.record} modifyType={this.props.modifyType} />}
      </div>
    );
  }
}

export default ValidatorModify;