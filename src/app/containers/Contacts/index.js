import React, { Component } from 'react';
import { Button, Card, Table, message, Tabs, Tooltip, Icon, Modal } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { EditableFormRow, EditableCell } from 'components/Rename';
import AddContacts from 'components/AddContacts';

import style from './index.less';

const { TabPane } = Tabs;

@inject(stores => ({
  language: stores.languageIntl.language,
  settingContactsColumns: stores.languageIntl.settingContactsColumns,
  normalData: stores.contacts.contacts.normalAddr,
  privateData: stores.contacts.contacts.privateAddr,
  contacts: stores.contacts.contacts,
  addAddress: (chain, addr, val) => stores.contacts.addAddress(chain, addr, val),
  addPrivateAddress: (addr, val) => stores.contacts.addPrivateAddress(addr, val),
  delAddress: (chain, addr) => stores.contacts.delAddress(chain, addr),
  delPrivateAddress: (addr) => stores.contacts.delPrivateAddress(addr),
}))

@observer
class Contacts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      config: [],
      type: 'normalAddr',
      rows: [],
      addInfo: {},
      delInfo: {}
    }
    console.log('this.props', this.props.normalData, this.props.privateData)
  }

  componentDidMount() {
    this.setState({ rows: this.getRowsData(this.props) });
  }

  componentDidUpdate(newProps, newState) {
    if (this.state.type !== newState.type) {
      this.setState({ rows: this.getRowsData(newProps) });
    }
  }

  getRowsData = (props) => {
    let rows;
    if (this.state.type === 'privateAddr') {
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

  handleCreate = (chainSymbol, address, name) => {
    if (this.state.type === 'normalAddr') {
      this.props.addAddress(chainSymbol, address, {
        name,
        address,
        chainSymbol
      }).then(() => {
        this.setState({ rows: this.getRowsData(this.props) });
      })
    } else {
      this.props.addPrivateAddress(address, {
        name,
        address,
        chainSymbol
      }).then(() => {
        this.setState({ rows: this.getRowsData(this.props) });
      })
    }
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
    if (this.state.type === 'normalAddr') {
      this.props.delAddress(chainSymbol, address).then(() => {
        this.setState({ rows: this.getRowsData(this.props) });
        this.handelDeleteModal();
      })
    } else {
      this.props.delPrivateAddress(address).then(() => {
        this.setState({ rows: this.getRowsData(this.props) });
        this.handelDeleteModal();
      })
    }
  }

  handleUpdateName = row => {
    console.log(row)
    const { chainSymbol, address, name } = row;
    this.props[this.state.type === 'normalAddr' ? 'addAddress' : 'addPrivateAddress'](chainSymbol, address, { chainSymbol, address, name }).then(
      () => {
        this.setState({ rows: this.getRowsData(this.props) });
      }
    );
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
        const data = this.state.type === 'normalAddr' ? this.props.normalData : this.props.privateData;
        const len = Object.keys(data[value].address).length;
        if (index > 0 && this.state.rows[index - 1].chainSymbol === this.state.rows[index].chainSymbol) {
          obj.props.rowSpan = 0;
        } else {
          obj.props.rowSpan = len;
        }
        return obj;
      }
    },
    {
      title: intl.get('DApp.nameCol'),
      dataIndex: 'name',
      key: 'name',
      editable: true,
      width: '20%',
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
      width: '5%',
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
        handleSave: this.handleUpdateName,
      }),
    };
  });

  copy2Clipboard = addr => {
    wand.writeText(addr);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
  }

  handleChangeTab = e => {
    this.setState({
      type: e
    })
  }

  render() {
    const {
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
        this.colums[i].title = <AddContacts handleSave={this.handleCreate} />
      }
    }

    return (
      <div className={style['settings_network']}>
        <Tabs onChange={this.handleChangeTab}>
          <TabPane tab={intl.get('AddressBook.normalAddrTab')} key="normalAddr">
            <Table
              pagination={false}
              components={components}
              columns={this.columsTrees}
              rowClassName={() => 'editable-row'}
              rowKey={record => record.address}
              dataSource={this.state.rows}
            />
          </TabPane>
          <TabPane tab={intl.get('AddressBook.privateAddrTab')} key="privateAddr">
            <Table
              pagination={false}
              components={components}
              columns={this.columsTrees}
              rowClassName={() => 'editable-row'}
              rowKey={record => record.address}
              dataSource={this.state.rows}
            />
          </TabPane>
        </Tabs>
        {/* <Card title={intl.get('AddressBook.title')}>
          <Table components={components} columns={this.columsTrees} dataSource={this.state.rows} />
        </Card> */}
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
