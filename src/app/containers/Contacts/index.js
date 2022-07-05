import React, { Component } from 'react';
import { Button, Card, Table, message, Form, Tooltip, Icon, Modal } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { EditableFormRow, EditableCell } from 'components/Rename';
import AddContacts from 'components/AddContacts';

import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  settingContactsColumns: stores.languageIntl.settingContactsColumns,
  normalData: stores.contacts.contacts.normal,
  privateData: stores.contacts.contacts.private,
  contacts: stores.contacts.contacts,
  addAddress: (chain, add, val) => stores.contacts.addAddress(chain, add, val),
  delAddress: (chain, add) => stores.contacts.delAddress(chain, add),
}))

@observer
class Contacts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: [],
      type: 'address',
      rows: [],
      showAddModal: false,
      addInfo: {},
      delInfo: {}
    }
    console.log('this.props', this.props.normalData, this.props.privateData)
  }

  componentDidMount(props) {
    this.setState({ rows: this.getRowsData(this.props) });
  }

  getRowsData = (props) => {
    let rows;
    if (this.state.type === 'privateAddress') {
      rows = props.privateData;
    } else {
      rows = props.normalData;
    }
    rows = this.processRowData(rows);
    return rows;
  }

  processRowData = rows => {
    rows = Object.values(rows).filter(v => Object.keys(v.address).length);
    let rowData = [];
    rows.map(v => {
      rowData = [].concat(rowData, Object.values(v.address));
    });
    return rowData;
  }

  handleAddModal = () => {
    this.setState({
      showAddModal: !this.state.showAddModal
    })
  }

  handleCreate = () => {
    this.props.addAddress('Wanchain', '0xD837BBcd310B2910eA89F2E064Ab4dA91C8357bb', {
      name: 'clarence4',
      address: '0xD837BBcd310B2910eA89F2E064Ab4dA91C8357bb',
      chainSymbol: 'Wanchain'
    }).then(res => {
      this.setState({ rows: this.getRowsData(this.props) });
      this.handleAddModal();
    })
  }

  handelDeleteModal = () => {
    this.setState({
      showDeleteModal: !this.state.showDeleteModal
    })
  }

  handelDelInfo = item => {
    this.setState({
      delInfo: item
    })
  }

  handleDelete = () => {
    const { chainSymbol, address } = this.state.delInfo;
    this.props.delAddress(chainSymbol, address).then(() => {
      this.setState({ rows: this.getRowsData(this.props) });
      this.handelDeleteModal();
    })
  }

  colums = [
    {
      title: intl.get('DApp.chainCol'),
      dataIndex: 'chainSymbol',
      key: 'chainSymbol',
      width: '20%',
      render: (value, row, index) => {
        const obj = {
          children: value,
          props: {}
        };
        const data = this.state.type === 'address' ? this.props.normalData : this.props.privateData;
        const len = Object.keys(data[value].address).length;
        if (index > 0 && this.state.rows[index - 1].chainSymbol === this.state.rows[index].chainSymbol) {
          obj.props.rowSpan = 0;
        } else {
          obj.props.rowSpan = len;
        }
        console.log('value row index', value, row, index, obj);
        return obj;
      }
    },
    {
      title: intl.get('DApp.nameCol'),
      dataIndex: 'name',
      key: 'name',
      editable: true,
      width: '15%',
    },
    {
      title: intl.get('DApp.addressCol'),
      dataIndex: 'address',
      key: 'address',
      width: '55%',
      render: (text, record) =>
        <div className="addrText">
          <p className="address" style={{ marginRight: '10px' }}>{text}</p>
          <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(record.address, e)} /></Tooltip>
          <Tooltip placement="bottom" title={intl.get('Common.delete')}><Icon type="delete" onClick={e => {
            this.handelDeleteModal();
            this.handelDelInfo(record);
          }} /></Tooltip>
        </div>
    },
    {
      title: '',
      dataIndex: 'blank',
      key: 'blank',
      width: '10%',
    },
  ]

  columsTrees = this.colums.map((col) => {
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

  copy2Clipboard = addr => {
    wand.writeText(addr);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  render() {
    const {
      showAddModal,
      showDeleteModal,
      delInfo
    } = this.state;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    for (let i = 0; i < this.colums.length; i++) {
      if (this.colums[i].key !== 'blank') {
        this.colums[i].title = this.props.settingContactsColumns[i].title;
      } else {
        // this.colums[i].title = <Button className="createBtn" type="primary" shape="round" onClick={this.handleAddModal}>{intl.get('AddressBook.addContact')}</Button>
        this.colums[i].title = <AddContacts />
      }
    }

    return (
      <div className={style['settings_network']}>
        <Card title={intl.get('AddressBook.title')}>
          <Table components={components} columns={this.columsTrees} dataSource={this.state.rows} />
        </Card>
        {
          showDeleteModal &&
          <Modal
            className='delModal'
            destroyOnClose={true}
            title={intl.get('Config.deleteConfirm')}
            visible={showDeleteModal}
            onOk={() => this.handleDelete()}
            onCancel={() => this.handelDeleteModal()}
            closable={false}
            okText={intl.get('Common.ok')}
            cancelText={intl.get('Common.cancel')}
            bodyStyle={{ textAlign: 'center' }}
          >
            <div className={style.deleteMsg}>
              <span className={style.deleteConfirmMsg}>{intl.get('CopyAndQrcode.confirmText')} : </span>
              <span className={style.symbolSty}>{delInfo.name}</span>
            </div>
          </Modal>
        }
      </div>
    );
  }
}

export default Contacts;
