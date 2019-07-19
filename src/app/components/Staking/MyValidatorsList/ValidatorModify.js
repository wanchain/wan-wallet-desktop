import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Row, Col, Slider } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ValidatorModifySelect from 'componentUtils/ValidatorModifySelect';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';
import { checkFeeRate } from 'utils/helper';
import { MINDAYS, MAXDAYS, WALLET_ID_NATIVE, WALLET_ID_LEDGER, WALLET_ID_TREZOR } from 'utils/settings'

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
      showConfirmItem: {}
    }
  }

  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
  }

  showConfirmForm = () => {
    let { form, settings, modifyType } = this.props;
    console.log(modifyType, 'ppppppppppppppp')
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
    let from = record.myAddress.addr;
    let type = record.myAddress.type;
    let walletID = type !== 'normal' ? eval(`WALLET_ID_${type.toUpperCase()}`) : WALLET_ID_NATIVE;
    
    let tx = {
      from: from,
      amount: 0,
      BIP44Path: type !== 'normal' ? addrInfo[type][from].path : "m/44'/5718350'/0'/0/" + addrInfo[type][from].path,
      walletID: walletID,
      lockTime: modifyType === 'exit' ? 0 : form.getFieldValue('lockTime'),
      minerAddr: record.validator.address
    }

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
        this.setState({ confirmVisible: false });
        this.props.onSend(walletID);
      });
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

  render() {
    const { onCancel, form, settings, record, addrInfo, modifyType } = this.props;
    const { getFieldDecorator, getFieldValue } = form;
    let formValues = { publicKey1: record.publicKey1, myAddr: record.myAccount, lockTime: getFieldValue('lockTime'), feeRate: getFieldValue('feeRate') };
    let title = modifyType === 'exit' ? intl.get('ValidatorRegister.exit') : intl.get('ValidatorRegister.verifyModification');

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
                  types={[intl.get(`${modifyTypes.lockTime}`), intl.get(`${modifyTypes.feeRate}`)]}
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
                    <Col span={12}>
                      <Form layout="inline">
                        <Form.Item>
                          {getFieldDecorator('lockTime', { initialValue: record.lockTime, rules: [{ required: true }] })
                            (<Slider className='locktime-slider' min={MINDAYS} max={MAXDAYS} step={1} onChange={this.onSliderChange} />)}
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col span={4}><span className="locktime-span">{getFieldValue('lockTime')} days</span></Col>
                  </Row>
                </div>
              </React.Fragment>
            }
            {
              modifyType === 'modify' && this.state.selectType === Object.keys(modifyTypes).findIndex(val => val === 'feeRate').toString() &&
              <React.Fragment>
                <CommonFormItem form={form} formName='maxFeeRate' disabled={true}
                  options={{ initialValue: 20, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.maxFeeRate')}
                />
                <CommonFormItem form={form} formName='currentFeeRate' disabled={true}
                  options={{ initialValue: 10, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.currentFeeRate')}
                />
                <CommonFormItem form={form} formName='feeRate'
                  options={{ rules: [{ required: true, validator: checkFeeRate }] }}
                  title={intl.get('ValidatorRegister.feeRate')}
                  placeholder={intl.get('ValidatorRegister.feeRateLimite')}
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