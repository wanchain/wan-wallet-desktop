import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Form } from 'antd';
import { getEosAccountInfo } from 'utils/helper';
import style from './index.less';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { EditableFormRow, EditableCell } from 'components/Rename';
import EOSImportAccountForm from '../EOSImportAccountForm';
const pu = require('promisefy-util');

const CHAINTYPE = 'EOS';
const AddAccountForm = Form.create({ name: 'addAccountForm' })(EOSImportAccountForm);
const CHAINID = 194;

@inject(stores => ({
  language: stores.languageIntl.language,
  getKeyList: stores.eosAddress.getKeyList,
  accountInfo: stores.eosAddress.accountInfo,
  chainId: stores.session.chainId,
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
      spin: false
    }
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'publicKey',
      render: (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={'EOS'} path={record.path} wid={record.wid} name={record.name} titles={{ imported: intl.get('title.importedKey') }} /></div>
    },
    {
      dataIndex: 'action',
      align: 'center',
      width: 114,
      render: (text, record) => <div><Button type="primary" onClick={() => { this.importAccount(record); }}>{intl.get('EOSKeyPairList.import')}</Button></div>
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

  importAccount = async (record) => {
    this.setState({
      spin: true
    });
    this.showAddAccountForm(record);
    try {
      let [importedList, accountList] = await Promise.all([pu.promisefy(wand.request, ['account_getImportedAccountsByPublicKey', { chainID: CHAINID, pubKey: record.publicKey, wids: [1, 6] }]), pu.promisefy(wand.request, ['account_getAccountByPublicKey', { chainType: CHAINTYPE, pubkey: record.publicKey }])]);
      let importSelections = [];
      let info = await getEosAccountInfo(accountList);
      accountList.forEach(v => {
        if (!importedList.includes(v) && info[v] && info[v].activeKeys.includes(record.publicKey)) {
          importSelections.push({
            account: v
          });
        }
      });
      this.setState({
        accountList: importSelections,
        spin: false
      });
    } catch (e) {
      console.log('error:', e);
      message.warn(intl.get('EOSKeyPairList.getAccountsFailed'));
      this.setState({
        accountList: [],
        spin: false
      });
    }
  }

  showAddAccountForm = (record) => {
    this.setState({
      showAddAccountForm: true,
      selectedRow: record,
    });
  }

  handleSave = row => {
    this.props.updateKeyName(row, row.wid);
  }

  handleCancel = () => {
    this.setState({
      showAddAccountForm: false,
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
