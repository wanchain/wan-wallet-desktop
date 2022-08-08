import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Table, Row, Col, message, Tag } from 'antd';
import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { hasSameName, createTRXAddr } from 'utils/helper';
import { EditableFormRow, EditableCell } from 'components/Rename';
import WarningExistAddress from 'components/WarningExistAddress';

const CHAINTYPE = 'TRX';

@inject(stores => ({
  addrInfo: stores.trxAddress.addrInfo,
  language: stores.languageIntl.language,
  getAddrList: stores.trxAddress.getAddrList,
  getAllAmount: stores.trxAddress.getAllAmount,
  transParams: stores.sendTransParams.transParams,
  addAddress: newAddr => stores.trxAddress.addAddress(newAddr),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  updateName: (arr, type) => stores.trxAddress.updateName(arr, type),
}))

@observer
class TrxAccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isUnlock: false,
      isExist: false,
      address: undefined,
    }
    this.canCreate = true;
  }

  columns = [
    {
      dataIndex: 'name',
      editable: true
    },
    {
      dataIndex: 'address',
      render: (text, record) => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} type={CHAINTYPE} path={record.path} wid={record.wid} name={record.name} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
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

  componentDidMount() {
    this.props.changeTitle('WanAccount.wallet');
  }

  componentWillUnmount() {
  }

  createAccount = () => {
    const { addAddress, getAddrList } = this.props;

    if (this.canCreate) {
      try {
        this.canCreate = false;
        let checkDuplicate = address => {
          if (getAddrList.find(obj => obj.address.toLowerCase() === address.toLowerCase())) {
            this.setState({ address, isExist: true });
            return true;
          }
          return false;
        }
        createTRXAddr(checkDuplicate).then(addressInfo => {
          addAddress(addressInfo);
          this.canCreate = true;
          message.success(intl.get('WanAccount.createAccountSuccess'));
        }).catch((e) => {
          this.canCreate = true;
          if (e.message === 'exist') {
            return;
          }
          message.warn(intl.get('WanAccount.createAccountFailed'));
        });
      } catch (e) {
        console.log('err:', e);
        this.canCreate = true;
        message.warn(intl.get('WanAccount.createAccountFailed'));
      };
    }
  }

  handleSave = row => {
    if (hasSameName('normal', row, this.props.addrInfo)) {
      message.warn(intl.get('WanAccount.notSameName'));
    } else {
      this.props.updateName(row, row.wid);
    }
  }

  onCloseModal = () => {
    this.setState({ isExist: false })
  }

  render() {
    const { getAllAmount, getAddrList } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    this.props.language && this.columnsTree.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })
    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left">
            <img className="totalImg" src={totalImg} alt={intl.get('WanAccount.wanchain')} />
            <span className="wanTotal">{getAllAmount}</span>
            <span className="wanTex">{'TRX'}</span>
            <Tag className="symbol">{intl.get('Common.tron')}</Tag>
          </Col>
          <Col span={12} className="col-right">
            <Button className="createBtn" type="primary" shape="round" size="large" onClick={this.createAccount}>{intl.get('Common.create')}</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={this.columnsTree} dataSource={getAddrList} />
          </Col>
        </Row>
        {
          this.state.isExist && <WarningExistAddress title={intl.get('Common.warning')} address={this.state.address} onCloseModal={this.onCloseModal} text={intl.get('WanAccount.newAddressExistInImportedList')}/>
        }
      </div>
    );
  }
}

export default TrxAccount;
