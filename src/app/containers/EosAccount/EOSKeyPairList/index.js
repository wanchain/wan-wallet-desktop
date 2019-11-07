import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Form, message } from 'antd';

import style from './index.less';
import { EOSPATH, WALLETID } from 'utils/settings';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { EditableFormRow, EditableCell } from 'components/Rename';
import EOSAddAccountForm from '../EOSAddAccountForm';

const CHAINTYPE = 'EOS';
const AddAccountForm = Form.create({ name: 'addAccountForm' })(EOSAddAccountForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  getKeyList: stores.eosAddress.getKeyList,
}))

@observer
class EOSKeyPairList extends Component {
  constructor (props) {
    super(props);
    this.state = {
      showAddAccountForm: false
    }
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'publicKey',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><Button type="primary" onClick={this.showAddAccountForm}>Add Account</Button></div>
    }
  ];

  columnsTree = this.columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: record => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: this.handleSave,
      }),
    };
  });

  showAddAccountForm = () => {
    this.setState({
      showAddAccountForm: true
    });
  }

  handleCancel = () => {
    this.setState({
      showAddAccountForm: false
    })
  }

  render () {
    const { getKeyList } = this.props;
    console.log('getKeyList:', getKeyList);
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      }
    };

    this.props.language && this.columnsTree.forEach(col => {
      col.title = intl.get(`EosAccount.${col.dataIndex}`)
    })

    return (
      <div>
          <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getKeyList} />
          <AddAccountForm showModal={this.state.showAddAccountForm} handleCancel={this.handleCancel}/>
      </div>
    );
  }
}

export default EOSKeyPairList;
