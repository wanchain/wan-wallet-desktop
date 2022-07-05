import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import AddContactsForm from './AddContactsForm';

const ContactsCreateForm = Form.create({ name: 'AddContactsForm' })(AddContactsForm);

@inject(stores => ({
  chainId: stores.session.chainId,
}))

@observer
class AddContacts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spin: true,
      visible: false,
    }
  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  showModal = async () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false, spin: true });
  }

  saveFormRef = formRef => {
    this.formRef = formRef;
  }

  render() {
    const { visible, spin } = this.state;
    const { balance, walletID } = this.props;

    return (
      <div>
        <Button className="createBtn" type="primary" shape="round" onClick={this.showModal}>{intl.get('AddressBook.addContact')}</Button>
        { visible && <ContactsCreateForm balance={balance} walletID={walletID} wrappedComponentRef={this.saveFormRef} onCancel={this.handleCancel} spin={spin} disablePrivateTx={this.props.disablePrivateTx} />}
      </div>
    );
  }
}

export default AddContacts;
