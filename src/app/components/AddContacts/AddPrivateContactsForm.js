import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input } from 'antd';
import intl from 'react-intl-universal';
import { isValidChecksumOTAddress } from 'wanchain-util';
import style from './index.less';

const chainSymbol = 'Wanchain';

@inject(stores => ({
  hasSameName: (chain, name) => stores.contacts.hasSameName(chain, name),
  hasSameContact: (addr) => stores.contacts.hasSameContact(addr)
}))

@observer
class AddPrivateContactsForm extends Component {
  componentWillUnmount() {
    this.setState = () => true;
  }

  checkAddr = async (rule, value, callback) => {
    if (!chainSymbol || !value) {
      callback(rule.message);
      return;
    }
    let valid = false;
    valid = this.checkToWanPrivateAddr(value);
    if (!valid) {
      callback(rule.message);
      return;
    }
    const isReapeat = this.props.hasSameContact(value);
    valid = !isReapeat;
    valid && callback();
    // repeat addresss
    !valid && callback(rule.message);
  }

  checkName = (rule, value, callback) => {
    const { hasSameName } = this.props;
    if (!chainSymbol || !value) {
      callback(rule.message);
      return;
    }
    const res = hasSameName(chainSymbol, value)
    res && callback(intl.get('AddressBook.nameRepeat'));
    !res && callback();
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
    const { form, handleSave } = this.props;
    form.validateFields(err => {
      if (err) return;
      const { address, nickname } = form.getFieldsValue(['address', 'nickname']);
      handleSave(chainSymbol, address, nickname);
      this.onCancel()
    })
  }

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible={true}
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('AddressBook.addContact')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button key="submit" type="primary" onClick={this.handleSave}>{intl.get('Common.save')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
            <Form.Item label={intl.get('AddressBook.nickname')}>
              {getFieldDecorator('nickname', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkName }] })
                (<Input placeholder={intl.get('AddressBook.addNicknamePlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.address')}>
              {getFieldDecorator('address', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkAddr }] })
                (<Input placeholder={intl.get('AddressBook.addAddressPlaceHolder')} />)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default AddPrivateContactsForm;
