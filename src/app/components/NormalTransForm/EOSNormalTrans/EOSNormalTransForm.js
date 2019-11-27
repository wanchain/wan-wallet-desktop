import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, InputNumber, message, Spin } from 'antd';
import intl from 'react-intl-universal';
import style from '../index.less';
import EOSConfirmForm from './EOSConfirmForm';
import { EOSPATH } from 'utils/settings';

const { TextArea } = Input;
const Confirm = Form.create({ name: 'EOSConfirmForm' })(EOSConfirmForm);

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  keyInfo: stores.eosAddress.keyInfo,
  selectedAccount: stores.eosAddress.selectedAccount,
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
}))

@observer
class EOSNormalTransForm extends Component {
  state = {
    confirmVisible: false,
    formData: {}
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleNext = () => {
    const { form, settings, selectedAccount } = this.props;
    const data = form.getFieldsValue();
    form.validateFields(err => {
      if (err) {
        console.log('handleNext', err);
        return;
      };
      let pwd = data['pwd'];
      let amount = data['amount'];
      if (new BigNumber(amount).gt(selectedAccount.balance)) {
        message.warn('No sufficient balance');
        return false;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_reveal', { pwd: pwd }, (err) => {
          if (err) {
            message.warn(intl.get('Backup.invalidPassword'));
          } else {
            this.setState({ formData: data, confirmVisible: true });
          }
        })
      } else {
        this.setState({ formData: data, confirmVisible: true });
      }
    });
  }

  getPathAndIdByPublicKey = key => {
    const { keyInfo } = this.props;
    let obj = {};
    Object.keys(keyInfo).find(t => {
      if (keyInfo[t][key]) {
        obj = {
          path: keyInfo[t][key].path,
          walletID: key === 'normal' ? 1 : (key === 'import' ? 5 : 1)
        }
        return true;
      } else {
        return false;
      }
    });
    return obj;
  }

  sendTrans = () => {
    const { form, selectedAccount, keyInfo } = this.props;
    const data = form.getFieldsValue();
    let pathAndId = this.getPathAndIdByPublicKey(selectedAccount.publicKey);
    let params = {
      symbol: 'EOS',
      from: data.from,
      to: data.to,
      amount: `${data.amount} EOS`,
      BIP44Path: `${EOSPATH}${pathAndId.path}`,
      walletID: pathAndId.walletID,
    }
    wand.request('transaction_EOSNormal', params, (err, res) => {
      if (err || res.code === false) {
        message.warn('Send transaction failed');
        console.log('Send transaction failed:', err || res);
      } else {
        this.props.updateTransHistory();
        console.log('res: ', res);
        message.success('Send transaction successfully');
      }
    });

    this.props.onCancel();
  }

  checkToAccount = (rule, value, callback) => {
    let reg = new RegExp(/^[a-z][a-z1-5\.]+$/);
    if (reg.test(value)) {
      callback();
    } else {
      callback(intl.get('Invalid account name'));
    }
  }

  checkAmount = (rule, value, callback) => {
    if (!Number.isNaN(Number(value)) && Number(value) > 0) {
      callback();
    } else {
      callback(intl.get('Invalid'));
    }
  }

  checkMemo = (rule, value, callback) => {
    callback();
  }

  render() {
    const { form, settings, selectedAccount } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible
          wrapClassName={style.EOSNormalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('NormalTransForm.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleNext}>{intl.get('NormalTransForm.next')}</Button>,
          ]}
        >
          <Spin spinning={false} tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} />} className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('NormalTransForm.from')}>
                {getFieldDecorator('from', { initialValue: selectedAccount.account })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: 'Invalid account name', validator: this.checkToAccount }] })
                  (<Input placeholder={'Recipient Account'} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                  (<InputNumber min={0} precision={4} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
              </Form.Item>
              {
                settings.reinput_pwd &&
                <Form.Item label={intl.get('NormalTransForm.password')}>
                  {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                    (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                </Form.Item>
              }
              <Form.Item label={'Memo'}>
                {getFieldDecorator('memo', { rules: [{ message: 'Invalid', validator: this.checkMemo }] })
                  (<TextArea style={{ borderRadius: '4px' }} placeholder='Memo' prefix={<Icon type="credit-card" className="colorInput" />} />)}
              </Form.Item>
            </Form>
          </Spin>
        </Modal>
        {this.state.confirmVisible && <Confirm sendTrans={this.sendTrans} onCancel={this.handleConfirmCancel} formData={this.state.formData} />}
      </div>
    );
  }
}

export default EOSNormalTransForm;
