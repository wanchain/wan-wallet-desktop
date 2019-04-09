import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import helper from 'utils/helper';
import { remote, ipcRenderer } from 'electron';

const { createWanAccount, unlockHDWallet } = helper;
const windowCurrent = remote.getCurrentWindow();
class WanAccount extends Component {
  state = {
    total:'',
    accounts: []
  }

  columns = [{
    title: 'Name',
    dataIndex: 'name',
  }, {
    title: 'Address',
    dataIndex: 'address',
  }, {
    title: 'Balance',
    dataIndex: 'balance',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.balance - b.balance,
  }, {
    title: 'Actions',
    dataIndex: 'actions',
    render: () => <div><Button type="primary">Instant Send</Button></div>
  }];
  
  data = [{
    key: '1',
    name: 'Account1',
    address: 32,
    balance: '11'
  }, {
    key: '2',
    name: 'Account2',
    address: 42,
    balance: '1'
  }, {
    key: '3',
    name: 'Account3',
    address: 32,
    balance: '2'
  }, {
    key: '4',
    name: 'Account4',
    address: 32,
    balance: '3'
  }];
  componentWillMount() {

  }

  componentDidMount() {
    const accounts = this.state.accounts;
    ipcRenderer.on('address-generated', (event, ret) => {
      console.log(ret.addresses)
      this.setState({
        accounts: accounts.concat(ret.addresses)
      })
    })
  }

  creatAccount = () => {
    createWanAccount(windowCurrent, 0, 1);
  }

  unlockHD = async () => {
    let isUnlock = await unlockHDWallet()
    console.log(isUnlock, '111111111111')
  }
  onChange = (pagination, filters, sorter) => {
    console.log('params', pagination, filters, sorter);
  }
  render() {
    return (
      <div className="account">
        <Row className="top">
          <Col span={4}>WAN (wanchain)</Col>
          <Col span={4}>Total:</Col>
          <Col span={16} className="createBtn">
            <Button type="primary" onClick={this.unlockHD}>unlockHD</Button>
            <Button type="primary" onClick={this.creatAccount}>Create Account</Button>
          </Col>
        </Row>
        <Row className="main">
          <Col>
            <Table bordered={false} pagination={false} columns={this.columns} dataSource={this.data} onChange={this.onChange} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;