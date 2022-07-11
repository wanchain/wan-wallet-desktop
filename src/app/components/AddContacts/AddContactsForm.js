import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Select } from 'antd';
import intl from 'react-intl-universal';
import { checkAddrByCT4Contacts, checkAddrIsRepeat4Contacts } from '../../utils/helper';
import { isValidChecksumOTAddress } from 'wanchain-util';
import style from './index.less';

const { Option } = Select;

@inject(stores => ({
  hasSameName: (chain, name) => stores.contacts.hasSameName(chain, name),
}))

@observer
class NormalTransForm extends Component {
  componentWillUnmount() {
    this.setState = () => true;
  }

  checkAddr = async (rule, value, callback) => {
    const { form, isPrivate } = this.props;
    const chainType = form.getFieldValue('chain');
    if (!chainType || !value) {
      callback(rule.message);
      return;
    }
    let valid = false;
    if (chainType === 'Wanchain' && isPrivate) {
      valid = this.checkToWanPrivateAddr(value);
    } else {
      valid = await checkAddrByCT4Contacts(value, chainType);
    }
    if (!valid) {
      callback(rule.message);
      return;
    }
    valid = await checkAddrIsRepeat4Contacts(value);
    valid && callback();
    // repeat addresss
    !valid && callback(rule.message);
  }

  checkName = async (rule, value, callback) => {
    const { hasSameName, form } = this.props;
    const chainType = form.getFieldValue('chain');
    if (!chainType || !value) {
      callback(rule.message);
      return;
    }
    hasSameName(chainType, value).then(res => {
      res && callback(intl.get('AddressBook.nameRepeat'));
      !res && callback();
    })
  }

  checkToWanPrivateAddr = (value) => {
    if (isValidChecksumOTAddress(value) || /^0x[0-9a-f]{132}$/i.test(value) || /^0x[0-9A-F]{132}$/i.test(value)) {
      return true;
    } else {
      return false;
    }
  }

  checkChain = (rule, value, callback) => {
    value && callback();
    !value && callback(rule.message);
  }

  onCancel = () => {
    this.props.onCancel();
  }

  handleSave = () => {
    console.log('save')
    const { form, handleSave } = this.props;
    form.validateFields(err => {
      if (err) return;
      const { chain, address, username } = form.getFieldsValue(['chain', 'address', 'username']);
      handleSave(chain, address, username);
      this.onCancel()
    })
  }

  render() {
    const { form, chainList } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible={true}
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('NormalTransForm.transaction')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleSave}>{intl.get('Common.save')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
            <Form.Item label={intl.get('AddressBook.username')}>
              {getFieldDecorator('username', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkName }] })
                (<Input placeholder={intl.get('AddressBook.addUsernamePlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.address')}>
              {getFieldDecorator('address', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkAddr }] })
                (<Input placeholder={intl.get('AddressBook.addAddressPlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.chain')}>
              {getFieldDecorator('chain', { initialValue: undefined, rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkChain }] })
                (<Select
                  placeholder={intl.get('AddressBook.addChainPlaceHolder')}
                  dropdownMatchSelectWidth
                  onChange={this.handleSelectChange}
                >
                  {chainList.map(v => <Option value={v} key={v}><img src={v.imgUrl} />{v}</Option>)}
                </Select>)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default NormalTransForm;
