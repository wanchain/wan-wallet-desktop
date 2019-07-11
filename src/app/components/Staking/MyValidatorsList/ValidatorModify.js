import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Icon, message, Row, Col, Slider } from 'antd';

import './index.less';
import PwdForm from 'componentUtils/PwdForm';
import CommonFormItem from 'componentUtils/CommonFormItem';
import ValidatorConfirmForm from 'components/Staking/ValidatorConfirmForm';

const Confirm = Form.create({ name: 'ValidatorConfirmForm' })(ValidatorConfirmForm);

const MINDAYS = 7;
const MAXDAYS = 99;
const WALLET_ID_NATIVE = 0x01;
const WALLET_ID_LEDGER = 0x02;
const WALLET_ID_TREZOR = 0x03;

@inject(stores => ({
  settings: stores.session.settings,
  addrInfo: stores.wanAddress.addrInfo,
}))

@observer
class ModifyForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmVisible: false,
      lockTime: this.props.record.lockTime
    }
  }

  showConfirmForm = () => {
    let { form, settings } = this.props;
    form.validateFields(err => {
      if (err) return;

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
    let walletID = type !== 'normal' ? `${`WALLET_ID_${type.toUpperCase()}`}` : WALLET_ID_NATIVE;

    let tx = {
      from: from,
      amount: 0,
      BIP44Path: "m/44'/5718350'/0'/0/" + addrInfo[type][from].path,
      walletID: walletID,
      lockTime: form.getFieldValue('lockTime'),
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

  onSliderChange = value => {
    this.setState({locktime: value})
  }

  onConfirmCancel = () => {
    this.setState({ confirmVisible: false });
  }

  render() {
    const { onCancel, form, settings, record, addrInfo, type } = this.props;
    const { getFieldDecorator } = form;
    let showConfirmItem = { validatorAccount: true, myAddr: true, lockTime: true };
    let formValues = { publicKey1: record.publicKey1, myAddr: record.myAccount, lockTime: form.getFieldValue('lockTime') };

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
            <CommonFormItem form={form} formName='validatorAccount' disabled={true}
              options={{ initialValue: record.validator.address, rules: [{ required: true }] }}
              title={intl.get('ValidatorRegister.validatorAccount')}
            />
            {
              type === 'exit' 
              ? <CommonFormItem form={form} formName='lockTime' disabled={true}
                  options={{ initialValue: 0, rules: [{ required: true }] }}
                  title={intl.get('ValidatorRegister.lockTime')}
                />
              : <div className="validator-line">
                  <Row type="flex" justify="space-around" align="top">
                    <Col span={8}><span className="stakein-name">{intl.get('ValidatorRegister.lockTime')}</span></Col>
                    <Col span={12}>
                      <Form layout="inline">
                        <Form.Item>
                          {getFieldDecorator('lockTime', { initialValue: this.state.lockTime, rules: [{ required: true }] })
                            (<Slider className='locktime-slider' min={MINDAYS} max={MAXDAYS} step={1} onChange={this.onSliderChange}/>)}
                        </Form.Item>
                      </Form>
                    </Col>
                    <Col span={4}><span className="locktime-span">{this.state.lockTime} days</span></Col>
                  </Row>
                </div>
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
            { settings.reinput_pwd && <PwdForm form={form}/> }
          </div>
        </Modal>
        { this.state.confirmVisible && <Confirm showConfirmItem={showConfirmItem} onCancel={this.onConfirmCancel} onSend={this.onSend} record={formValues} title={intl.get('NormalTransForm.ConfirmForm.transactionConfirm')} /> }
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
    if(walletID === 2) {
      message.info(intl.get('Ledger.signTransactionInLedger'));
    }
  }

  render() {
    return (
      <div>
        <Button className="modifyTopUpBtn" onClick={this.handleStateToggle} />
        {this.state.visible && <ValidatorModifyForm onCancel={this.handleStateToggle} onSend={this.handleSend} record={this.props.record} type={this.props.type}/>}
      </div>
    );
  }
}

export default ValidatorModify;