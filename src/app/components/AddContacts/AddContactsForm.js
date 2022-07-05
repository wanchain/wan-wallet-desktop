import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Modal, Form, Input, Select } from 'antd';
import intl from 'react-intl-universal';
import style from './index.less';

const { Option } = Select;

// const Confirm = Form.create({ name: 'NormalTransForm' })(ConfirmForm);
// const AdvancedOption = Form.create({ name: 'NormalTransForm' })(AdvancedOptionForm);

@inject(stores => ({
  settings: stores.session.settings,
  from: stores.sendTransParams.currentFrom,

  normalContacts: stores.contacts.contacts.normal,
  privateContacts: stores.contacts.contacts.private,
}))

@observer
class NormalTransForm extends Component {
  state = {
    advanced: false,
    confirmVisible: false,
    advancedVisible: false,
    isPrivate: false,

    username: '',
    address: ''
  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  handleAdvancedCancel = () => {
    this.setState({
      advancedVisible: false,
    });
  }

  handleConfirmCancel = () => {
    this.setState({
      confirmVisible: false,
    });
  }

  onCancel = () => {
    this.setState({
      advanced: false
    });
    this.props.onCancel();
  }

  handleSave = () => {
    console.log('save')
  }

  handelInpName = e => {
    const { form } = this.props;
    this.setState({
      username: e.target.value
    })
    form.setFieldsValue({
      username: e.target.value
    });
  }

  handelInpAddress = e => {
    const { form } = this.props;
    this.setState({
      address: e.target.value
    })
    form.setFieldsValue({
      address: e.target.value
    });
  }

  onChange = e => {}

  render() {
    const { form, normalContacts } = this.props;
    const { username, address, chain } = this.state;
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
            <Button disabled={this.props.spin} key="submit" type="primary" onClick={this.handleSave}>{intl.get('Common.save')}</Button>,
          ]}
        >
          <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} className={style.transForm}>
            <Form.Item label={intl.get('AddressBook.username')}>
              {getFieldDecorator('username', { initialValue: username })
                (<Input onChange={this.handelInpName} placeholder={intl.get('AddressBook.addUsernamePlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.address')}>
              {getFieldDecorator('address', { initialValue: address })
                (<Input onChange={this.handelInpAddress} placeholder={intl.get('AddressBook.addAddressPlaceHolder')} />)}
            </Form.Item>
            <Form.Item label={intl.get('AddressBook.chain')}>
              {getFieldDecorator('chain', { initialValue: chain || undefined })
                (<Select
                  placeholder={intl.get('AddressBook.addChainPlaceHolder')}
                  dropdownMatchSelectWidth
                  onChange={this.onChange}
                >
                  {Object.keys(normalContacts).map(v => <Option value={v} key={v}>{v}</Option>)}
                </Select>)}
            </Form.Item>
          </Form>
        </Modal>

        {/* <AdvancedOption visible={advancedVisible} onCancel={this.handleAdvancedCancel} onSave={this.handleSave} estimateGas={this.estimateGasInAdvancedOptionForm} from={from} />
        {
          confirmVisible &&
          <Confirm visible={true} isPrivate={isPrivate} onCancel={this.handleConfirmCancel} sendTrans={this.sendTrans} from={from} loading={loading} />
        } */}
      </div>
    );
  }
}

export default NormalTransForm;
