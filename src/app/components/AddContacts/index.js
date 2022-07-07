import React, { Component } from 'react';
import { message, Button, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import AddContactsForm from './AddContactsForm';

const ContactsCreateForm = Form.create({ name: 'AddContactsForm' })(AddContactsForm);

@inject(stores => ({
  normalContacts: stores.contacts.contacts.normalAddr,
}))

@observer
class AddContacts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      chainList: Object.keys(this.props.normalContacts)
    }
  }

  componentWillUnmount() {
    this.setState = () => false;
  }

  showModal = async () => {
    this.setState({ visible: true });
  }

  handleCancel = () => {
    this.setState({ visible: false });
  }

  handleSave = (chainSymbol, address, name) => {
    this.props.handleSave(chainSymbol, address, name);
  }

  render() {
    const { visible, chainList } = this.state;

    return (
      <div>
        <Button className="createBtn" type="primary" shape="round" onClick={this.showModal}>{intl.get('AddressBook.addContact')}</Button>
        {
          visible &&
          <ContactsCreateForm
            chainList={chainList}
            handleSave={this.handleSave}
            onCancel={this.handleCancel}
          />}
      </div>
    );
  }
}

export default AddContacts;
