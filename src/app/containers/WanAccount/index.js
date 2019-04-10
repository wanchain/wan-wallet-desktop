import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import helper from 'utils/helper';
import { accumulator } from 'utils/support';
import { remote, ipcRenderer } from 'electron';

import './index.less';
const { createWanAccount, unlockHDWallet, getWanBalance } = helper;
const windowCurrent = remote.getCurrentWindow();

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  getAddrList: stores.wanAddress.getAddrList,
  addAddress: (newAddr) => stores.wanAddress.addAddress(newAddr),
  updateBalance: (newBalanceArr) => stores.wanAddress.updateBalance(newBalanceArr)
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

  componentDidMount() {
    this.timer = setInterval(() => {
      const promises = Object.keys(this.props.addrInfo).map(item => () => getWanBalance(item));
      const series = promises.reduce(accumulator, Promise.resolve([]));

      series.then(res => {
        console.log(res);
        if(res.length) {
          this.props.updateBalance(res);
        }
      }).catch(err => {
        console.log(err)
      });
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  sendTrans = (e) => {
    console.log(e.target)
    alert('oooooooooooo')
  }

  creatAccount = () => {
    const {addrInfo, addAddress} = this.props;
    const addrLen = Object.keys(addrInfo).length;
    this.setState({
      bool: false
    });
    if(this.state.bool) {
      ipcRenderer.once('address_got', async (event, ret) => {
        console.log('ret.length:', ret.length)
        let result = await getWanBalance(`0x${ret.addresses[0].address}`);
        ret.addresses[0].balance = result[`0x${ret.addresses[0].address}`];
        addAddress(ret.addresses[0]);
        this.setState({
          bool: true
        });
      })
      createWanAccount(windowCurrent, addrLen, addrLen + 1);
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
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={this.props.getAddrList} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;