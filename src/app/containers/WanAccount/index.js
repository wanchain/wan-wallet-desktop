import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';
import { getBalance } from 'utils/helper';

import { EditableFormRow, EditableCell } from './Rename';
import SendNormalTrans from 'components/SendNormalTrans';
import CopyAndQrcode from 'components/CopyAndQrcode';

const WAN = "m/44'/5718350'/0'/0/"

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.wanAddress.getAmount,
  getAddrList: stores.wanAddress.getAddrList,
  updateName: arr => stores.wanAddress.updateName(arr),
  addAddress: newAddr => stores.wanAddress.addAddress(newAddr),
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class WanAccount extends Component {
  state = {
    bool: true,
    isUnlock: false
  }

  columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      editable: true
    }, 
    {
      title: 'Address',
      dataIndex: 'address',
      render: text => <div>{text}<CopyAndQrcode addr={text}/></div>
    }, 
    {
      title: 'Balance',
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    }, 
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: text => <div><SendNormalTrans addr={text}/></div>
    }
  ];

  componentWillMount() {
    this.props.changeTitle('Wallet Detail')
  }

  creatAccount = () => {
    const { addrInfo, addAddress } = this.props;
    const addrLen = Object.keys(addrInfo).length;
    const self = this
    this.setState({
      bool: false
    });

    if(this.state.bool) {
      wand.request('address_get', { walletID: 1, chainType: 'WAN', start: addrLen, end: addrLen + 1 }, function(err, val_address_get) {
        if (!err) {
          let ret = val_address_get;
          wand.request('account_create', { walletID: 1, path: `${WAN}${addrLen}`, meta: {name: `Account${addrLen+1}`, addr: `0x${val_address_get.addresses[0].address}`}}, async function(err, val_account_create) {
            if (!err && val_account_create) {
              let addressInfo = ret.addresses[0];
              let balance = await getBalance(`0x${addressInfo.address}`);
              addressInfo.start = addressInfo.index;
              addressInfo.wanaddr = `0x${addressInfo.address}`;
              addressInfo.balance = balance[addressInfo.wanaddr];
              addAddress(addressInfo);
              self.setState({
                bool: true
              });
            }
          })
        }
      })
    }
  }

  unlockHD = () => {
    wand.request('wallet_unlock', { pwd: '123' }, (err, val) => {
      if (err) console.log('error printed inside callback: ', err)
      this.setState({
        isUnlock: val
      });
    })
  }

  handleSave = row => {
    this.props.updateName(row);
  }

  render() {
    const { getAmount } = this.props;
    const components = {
      body: {
        cell: EditableCell,
        row: EditableFormRow,
      },
    };

    const columns = this.columns.map((col) => {
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

    return (
      <div className="account">
        <Row className="title">
          <Col span={4}>WAN ( wanchain )</Col>
          <Col span={4}>Total: { getAmount }</Col>
          <Col span={8} offset={8}>
            <Button type="primary" shape="round" size="large" onClick={this.unlockHD}>unlockHD</Button>
            <Button type="primary" shape="round" size="large" onClick={this.creatAccount}>Create Account</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table components={components} rowClassName={() => 'editable-row'} className="content-wrap" pagination={false} columns={columns} dataSource={this.props.getAddrList} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;