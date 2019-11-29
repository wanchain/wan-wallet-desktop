import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Form, message } from 'antd';
import { getEOSMultiBalances } from 'utils/helper';
import style from './index.less';
import { EOSPATH, WALLETID } from 'utils/settings';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { EditableFormRow, EditableCell } from 'components/Rename';
import EOSImportAccountForm from '../EOSImportAccountForm';

const CHAINTYPE = 'EOS';
const AddAccountForm = Form.create({ name: 'addAccountForm' })(EOSImportAccountForm);

@inject(stores => ({
  language: stores.languageIntl.language,
  getKeyList: stores.eosAddress.getKeyList,
  accountInfo: stores.eosAddress.accountInfo,
  updateKeyName: (arr, type) => stores.eosAddress.updateKeyName(arr, type),
}))

@observer
class EOSKeyPairList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddAccountForm: false,
      selectedRow: {},
      accountList: [],
      spin: true
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
      render: (text, record) => <div><Button type="primary" onClick={() => { this.importAccount(record); }}>Import</Button></div>
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

  importAccount = (record) => {
    wand.request('account_getAccountByPublicKey', { chainType: CHAINTYPE, pubkey: record.publicKey }, (err, response) => {
      if (!err && response instanceof Array && response.length) {
        this.showAddAccountForm(record);
        let accountList = [];
        getEOSMultiBalances(response).then(info => {
          response.forEach(v => {
            if (info[v] && info[v].activeKeys.includes(record.publicKey)) {
              accountList.push({
                account: v
              });
            }
          });
          this.setState({
            accountList: accountList,
            spin: false
          });
        }).catch(() => {
          message.error('Get account list failed');
        });
      } else {
        console.log('error:', err);
        message.error('Get account list failed');
      }
    });
  }

  showAddAccountForm = (record) => {
    this.setState({
      showAddAccountForm: true,
      selectedRow: record,
    });
  }

  handleSave = row => {
    row.path = `${EOSPATH}${row.path}`;
    this.props.updateKeyName(row, 'normal');
  }

  handleCancel = () => {
    this.setState({
      showAddAccountForm: false
    })
  }

  render() {
    const { getKeyList } = this.props;
    let { selectedRow, accountList } = this.state;
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
        <Table components={components} rowClassName={() => 'editable-row'} rowKey="publicKey" className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getKeyList} />
        {
          this.state.showAddAccountForm && <AddAccountForm selectedRow={selectedRow} accounts={accountList} handleCancel={this.handleCancel} spin={this.state.spin} />
        }
      </div>
    );
  }
}

export default EOSKeyPairList;
