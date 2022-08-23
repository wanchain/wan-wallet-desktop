import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { BigNumber } from 'bignumber.js';
import { Button, Modal, Form, Input, Icon, InputNumber, message, Spin, AutoComplete, Select } from 'antd';
import intl from 'react-intl-universal';
import style from '../index.less';
import EOSConfirmForm from './EOSConfirmForm';
import AddContactsModal from '../../AddContacts/AddContactsModal';
import { getWalletIdByType } from 'utils/helper';

const { TextArea } = Input;
const Confirm = Form.create({ name: 'EOSConfirmForm' })(EOSConfirmForm);
const AddContactsModalForm = Form.create({ name: 'AddContactsModal' })(AddContactsModal);
const { Option } = Select;
const chainSymbol = 'EOS';

@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  from: stores.sendTransParams.currentFrom,
  keyInfo: stores.eosAddress.keyInfo,
  selectedAccount: stores.eosAddress.selectedAccount,
  contacts: stores.contacts.contacts,
  updateTransHistory: () => stores.eosAddress.updateTransHistory(),
  addAddress: (chain, addr, val) => stores.contacts.addAddress(chain, addr, val),
  hasSameContact: (addr, chain) => stores.contacts.hasSameContact(addr, chain),
}))

@observer
class EOSNormalTransForm extends Component {
  state = {
    confirmVisible: false,
    loading: false,
    formData: {},
    contactsList: [],
    isNewContacts: false,
    showAddContacts: false
  }

  componentDidMount() {
    this.processContacts();
  }

  processContacts = () => {
    const { normalAddr } = this.props.contacts;
    let contactsList = Object.values(normalAddr[chainSymbol]);
    this.setState({
      contactsList
    })
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
        message.warn(intl.get('EOSAccountList.noSufficientBalance'));
        return false;
      }
      if (settings.reinput_pwd) {
        if (!pwd) {
          message.warn(intl.get('Backup.invalidPassword'));
          return;
        }
        wand.request('phrase_checkPwd', { pwd: pwd }, (err) => {
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
          walletID: getWalletIdByType(key)
        }
        return true;
      } else {
        return false;
      }
    });
    return obj;
  }

  sendTrans = () => {
    const { form, selectedAccount } = this.props;
    const data = form.getFieldsValue();
    let params = {
      symbol: 'EOS',
      from: data.from,
      to: data.to,
      amount: `${data.amount} EOS`,
      memo: String(data.memo).trim(),
      BIP44Path: `${selectedAccount.path}`,
      walletID: selectedAccount.id,
    };
    this.setState({
      loading: true
    });
    wand.request('transaction_EOSNormal', params, (err, res) => {
      if (err || res.code === false) {
        message.warn(intl.get('EOSNormalTransForm.sendTxFailed'));
        console.log(intl.get('EOSNormalTransForm.sendTxFailed'), err || res);
      } else {
        this.props.updateTransHistory();
        message.success(intl.get('EOSNormalTransForm.sendTxSuccess'));
      }
      this.props.onCancel();
    });
  }

  checkToAccount = (rule, value, callback) => {
    let reg = /^[a-z][1-5a-z\.]{11}$/g;
    if (reg.test(value)) {
      const isNewContacts = this.props.hasSameContact(value, chainSymbol);
      this.setState({
        isNewContacts: !isNewContacts
      })
      callback();
    } else {
      this.setState({
        isNewContacts: false
      })
      callback(intl.get('EOSNormalTransForm.invalidAccountName'));
    }
  }

  checkAmount = (rule, value, callback) => {
    if (!Number.isNaN(Number(value)) && Number(value) > 0) {
      callback();
    } else {
      callback(intl.get('EOSNormalTransForm.invalid'));
    }
  }

  checkMemo = (rule, value, callback) => {
    if (value.length === 0) {
      callback();
    } else if (typeof value === 'string') {
      let strlen = 0;
      for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) > 255) {
          strlen += 3;
        } else {
          strlen++;
        }
      }
      if (strlen <= 256) {
        callback();
      } else {
        callback(intl.get('EOSNormalTransForm.invalidMemo'));
      }
    } else {
      callback(intl.get('EOSNormalTransForm.invalidMemo'));
    }
  }

  renderOption = item => {
    return (
      <Option key={item.address} text={item.address} name={item.name}>
        <div className="global-search-item">
          <span className="global-search-item-desc">
            {item.name}-{item.address}
          </span>
        </div>
      </Option>
    )
  }

  handleCreate = (address, name) => {
    this.props.addAddress(chainSymbol, address, {
      name,
      address,
      chainSymbol
    }).then(async () => {
      this.setState({
        isNewContacts: false
      });
      this.processContacts();
    })
  }

  handleShowAddContactModal = () => {
    this.setState({
      showAddContacts: !this.state.showAddContacts
    })
  }

  filterContactList = (inputValue, option) => {
    const text = option.props.text.toLowerCase();
    const name = option.props.name.toLowerCase();
    const inp = inputValue.toLowerCase();
    return text.includes(inp) || name.includes(inp);
  }

  render() {
    const { form, settings, selectedAccount } = this.props;
    const { getFieldDecorator } = form;
    const { contactsList, isNewContacts, showAddContacts } = this.state;

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
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleNext}>{intl.get('Common.next')}</Button>,
          ]}
        >
          <Spin spinning={false} size="large" /* tip={intl.get('Loading.transData')} indicator={<Icon type="loading" style={{ fontSize: 24 }} />} */ className="loadingData">
            <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
              <Form.Item label={intl.get('Common.from')}>
                {getFieldDecorator('from', { initialValue: selectedAccount.account })
                  (<Input disabled={true} prefix={<Icon type="wallet" className="colorInput" />} />)}
              </Form.Item>
              <Form.Item label={intl.get('NormalTransForm.to')}>
                {getFieldDecorator('to', { rules: [{ required: true, message: intl.get('EOSNormalTransForm.invalidAccountName'), validator: this.checkToAccount }] })
                  (
                    <AutoComplete
                      getPopupContainer={node => node.parentNode}
                      size="large"
                      style={{ width: '100%' }}
                      filterOption={this.filterContactList}
                      dataSource={contactsList.map(this.renderOption)}
                      placeholder="input here"
                      optionLabelProp="text"
                    >
                     <Input placeholder={intl.get('EOSNormalTransForm.recipientAccount')} prefix={<Icon type="wallet" className="colorInput" />} />
                    </AutoComplete>
                  )}
                  {
                    isNewContacts
                    ? <Button className={style.addNewContacts} shape="round" onClick={this.handleShowAddContactModal}>
                      <span className={style.magicTxt}>
                        {intl.get('NormalTransForm.addNewContacts')}
                      </span>
                    </Button>
                    : null
                  }
              </Form.Item>
              <Form.Item label={intl.get('Common.amount')}>
                {getFieldDecorator('amount', { rules: [{ required: true, message: intl.get('NormalTransForm.amountIsIncorrect'), validator: this.checkAmount }] })
                  (<InputNumber min={0.0001} precision={4} placeholder='0' prefix={<Icon type="credit-card" className="colorInput" />} />)}
              </Form.Item>
              {
                settings.reinput_pwd &&
                <Form.Item label={intl.get('NormalTransForm.password')}>
                  {getFieldDecorator('pwd', { rules: [{ required: true, message: intl.get('NormalTransForm.pwdIsIncorrect') }] })
                    (<Input.Password placeholder={intl.get('Backup.enterPassword')} prefix={<Icon type="lock" className="colorInput" />} />)}
                </Form.Item>
              }
              <Form.Item label={intl.get('EOSNormalTransForm.memo')}>
                {getFieldDecorator('memo', { initialValue: '', rules: [{ message: intl.get('EOSNormalTransForm.invalid'), validator: this.checkMemo }] })
                  (<TextArea style={{ borderRadius: '4px' }} placeholder={intl.get('EOSNormalTransForm.memo')} prefix={<Icon type="credit-card" className="colorInput" />} />)}
              </Form.Item>
            </Form>
          </Spin>
        </Modal>
        {this.state.confirmVisible && <Confirm sendTrans={this.sendTrans} onCancel={this.handleConfirmCancel} loading={this.state.loading} formData={this.state.formData} />}
        {
          showAddContacts && <AddContactsModalForm handleSave={this.handleCreate} onCancel={this.handleShowAddContactModal} address={form.getFieldValue('to')} chain={chainSymbol}></AddContactsModalForm>
        }
      </div>
    );
  }
}

export default EOSNormalTransForm;
