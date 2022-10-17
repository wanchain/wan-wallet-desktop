import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Select } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';

const { Option } = Select;

// const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
// const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  hasSameName: (chain, name) => stores.contacts.hasSameName(chain, name),
}))

@observer
class AddContactsModal extends Component {
  state = {
    isPrivate: false,
    spin: false
  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  onCancel = () => {
    this.props.onCancel();
  }

  checkName = (rule, value, callback) => {
    if (!value) {
      callback(intl.get('AddressBook.addNickname'));
      return;
    }
    const { hasSameName, chain } = this.props;
    const res = hasSameName(chain, value);
    if (res) {
      this.setState({
        spin: true
      })
      callback(rule.message);
    } else {
      this.setState({
        spin: false
      })
      callback();
    }
  }

  handleSave = () => {
    const { form, handleSave, address, chain } = this.props;
    form.validateFields(err => {
      if (err) return;
      const nickName = form.getFieldValue('nickName');
      if (chain === 'XRPL') {
        const tag = form.getFieldValue('tag');
        handleSave(address, nickName, tag);
      } else if (chain === 'EOS') {
        const memo = form.getFieldValue('memo');
        handleSave(address, nickName, memo);
      } else {
        handleSave(address, nickName);
      }
      this.onCancel();
    })
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
    const { form, address, chain } = this.props;
    const { spin } = this.state;
    const { getFieldDecorator } = form;

    return (
      <div>
        <Modal
          visible={true}
          wrapClassName={style.normalTransFormModal}
          destroyOnClose={true}
          closable={false}
          title={intl.get('AddressBook.saveContact')}
          onCancel={this.onCancel}
          footer={[
            <Button key="back" className="cancel" onClick={this.onCancel}>{intl.get('Common.cancel')}</Button>,
            <Button disabled={spin} key="submit" type="primary" onClick={this.handleSave}>{intl.get('Common.save')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
            <Form.Item label={intl.get('AddressBook.address')}>
              {getFieldDecorator('address', { initialValue: address })
                (<Input disabled={true} />)}
            </Form.Item>
            {
              chain === 'XRPL' &&
              <Form.Item label={intl.get('Xrp.destinationTag')}>
                {getFieldDecorator('tag', { rules: [{ message: intl.get('NormalTransForm.destinationTagRule'), validator: this.checkDestinationTag }] })
                  (<Input placeholder={'Tag'} />)}
              </Form.Item>
            }
            {
              chain === 'EOS' &&
              <Form.Item label={intl.get('EOSNormalTransForm.memo')}>
                {getFieldDecorator('memo', { rules: [{ message: intl.get('EOSNormalTransForm.invalid'), validator: this.checkMemo }] })
                  (<Input placeholder={intl.get('EOSNormalTransForm.memo')} />)}
              </Form.Item>
            }
            <Form.Item label={intl.get('AddressBook.nickname')}>
              {getFieldDecorator('nickName', { rules: [{ required: true, message: intl.get('AddressBook.wanNameRepeat'), validator: this.checkName }] })
                (<Input placeholder={intl.get('AddressBook.addNickname')} />)}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}

export default AddContactsModal;
