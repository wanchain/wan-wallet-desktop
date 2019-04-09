import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import helper from 'utils/helper';
import { remote, ipcRenderer } from 'electron';

import './index.less'
const { createWanAccount, unlockHDWallet, getWanBalance } = helper;
const windowCurrent = remote.getCurrentWindow();

@inject(stores => ({
  addrList: stores.wanAddress.addrList,
  updateAddress: (newAddr) => stores.wanAddress.updateAddress(newAddr),
}))

@observer
class WanAccount extends Component {
  state = {
    bool: true,
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
    sorter: (a, b) => a.balance - b.balance,
  }, {
    title: 'Actions',
    dataIndex: 'actions',
    render: () => <div><Button type="primary" onClick={this.sendTrans}>Instant Send</Button></div>
  }];
  
  componentWillMount() {

  }

  componentDidMount() {

  }

  sendTrans = (e) => {
    console.log(e.target)
    alert('oooooooooooo')
  }

  creatAccount = () => {
    const {addrList, updateAddress} = this.props;
    this.setState({
      bool: false
    });
    if(this.state.bool) {
      ipcRenderer.once('address_got', async (event, ret) => {
        ret.addresses[0].balance = await getWanBalance(`0x${ret.addresses[0].address}`)
        updateAddress(ret.addresses[0]);
        this.setState({
          bool: true
        });
      })
      createWanAccount(windowCurrent, addrList.length, addrList.length + 1);
    }

  }

  unlockHD = async () => {
    let isUnlock = await unlockHDWallet('123')
    console.log(isUnlock, 'isUnlock')
  }

  render() {
    return (
      <div className="account">
        <Row className="title">
          <Col span={4}>WAN ( wanchain )</Col>
          <Col span={4}>Total: 11560</Col>
          <Col span={8} offset={8}>
            <Button type="primary" size="large" onClick={this.unlockHD}>unlockHD</Button>
            <Button type="primary" shape="round" size="large" onClick={this.creatAccount}>Create Account</Button>
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={this.props.addrList} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;