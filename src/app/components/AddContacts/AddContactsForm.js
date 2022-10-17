import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Select } from 'antd';
import intl from 'react-intl-universal';
import { checkAddrByCT4Contacts } from '../../utils/helper';
import style from './index.less';

const { Option } = Select;

@inject(stores => ({
  hasSameName: (chain, name) => stores.contacts.hasSameName(chain, name),
  hasSameContact: (addr, chain) => stores.contacts.hasSameContact(addr, chain)
}))

@observer
class AddContactsForm extends Component {
  state = {
    selectChain: ''
  }

  checkAddr = async (rule, value, callback) => {
    const { form, hasSameContact } = this.props;
    const chainType = form.getFieldValue('chain');
    if (!chainType) {
      callback(intl.get('AddressBook.wanChooseChain'));
      return;
    }
    if (!value) {
      callback(intl.get('AddressBook.wanAddrEmpty'));
      return;
    }
    let valid = false;
    valid = await checkAddrByCT4Contacts(value, chainType);
    if (!valid) {
      callback(rule.message);
      return;
    }
    const isReapeat = hasSameContact(value, chainType);
    valid = !isReapeat;
    valid && callback();
    // repeat addresss
    !valid && callback(intl.get('AddressBook.wanAddrAdded'));
  }

  checkName = (rule, value, callback) => {
    const { hasSameName, form } = this.props;
    const chainType = form.getFieldValue('chain');
    if (!chainType) {
      callback(intl.get('AddressBook.wanChooseChain'));
      return;
    }
    if (!value) {
      callback(intl.get('AddressBook.addNicknamePlaceHolder'));
      return;
    }
    const res = hasSameName(chainType, value);
    res && callback(rule.message);
    !res && callback();
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
    const { selectChain } = this.state;
    form.validateFields(err => {
      if (err) return;
      const { chain, address, nickname } = form.getFieldsValue(['chain', 'address', 'nickname']);
      if (selectChain === 'XRPL') {
        const { tag } = form.getFieldsValue(['tag']);
        handleSave(chain, address, nickname, tag);
      } else if (selectChain === 'EOS') {
        const { memo } = form.getFieldsValue(['memo']);
        handleSave(chain, address, nickname, memo);
      } else {
        handleSave(chain, address, nickname);
      }
      this.onCancel()
    })
  }

  handleSelectChange = selectChain => {
    this.setState({ selectChain });
  }

  checkDestinationTag = (rule, value, callback) => {
    if (value && !Number.isInteger(Number(value))) {
      callback(rule.message);
      return;
    }
    callback();
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

  render() {
    const { form, chainList } = this.props;
    const { getFieldDecorator } = form;
    const { selectChain } = this.state;

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
            <Form.Item label={intl.get('AddressBook.chain')}>
              {getFieldDecorator('chain', { initialValue: undefined, rules: [{ required: true, message: intl.get('AddressBook.wanChooseChain'), validator: this.checkChain }] })
                (<Select
                  getPopupContainer={node => node.parentNode}
                  placeholder={intl.get('AddressBook.addChainPlaceHolder')}
                  dropdownMatchSelectWidth
                  onChange={this.handleSelectChange}
                >
                  {chainList.map(v => <Option value={v} key={v}><img src={v.imgUrl} />{v}</Option>)}
                </Select>)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.nickname')}>
              {getFieldDecorator('nickname', { rules: [{ required: true, message: intl.get('AddressBook.wanNameRepeat'), validator: this.checkName }] })
                (<Input disabled={!form.getFieldValue('chain')} placeholder={intl.get('AddressBook.addNicknamePlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.address')}>
              {getFieldDecorator('address', { rules: [{ required: true, message: intl.get('NormalTransForm.addressIsIncorrect'), validator: this.checkAddr }] })
                (<Input disabled={!form.getFieldValue('chain')} placeholder={intl.get('AddressBook.addAddressPlaceHolder')} />)}
            </Form.Item>
            {
              selectChain === 'XRPL' &&
              <Form.Item label={intl.get('Xrp.destinationTag')}>
                {getFieldDecorator('tag', { rules: [{ message: intl.get('NormalTransForm.destinationTagRule'), validator: this.checkDestinationTag }] })
                  (<Input placeholder={'Tag'} />)}
              </Form.Item>
            }
            {
              selectChain === 'EOS' &&
              <Form.Item label={intl.get('EOSNormalTransForm.memo')}>
                {getFieldDecorator('memo', { rules: [{ message: intl.get('EOSNormalTransForm.invalid'), validator: this.checkMemo }] })
                  (<Input placeholder={intl.get('EOSNormalTransForm.memo')} />)}
              </Form.Item>
            }
          </Form>
        </Modal>
      </div>
    );
  }
}

export default AddContactsForm;
