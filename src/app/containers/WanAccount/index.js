import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import { remote, ipcRenderer } from 'electron';
import { observer, inject } from 'mobx-react';

import helper from 'utils/helper';
import { accumulator } from 'utils/support';
import SendNormalTrans from 'containers/SendNormalTrans';

import './index.less';
const { createWanAccount, unlockHDWallet, getWanBalance } = helper;
const windowCurrent = remote.getCurrentWindow();

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.wanAddress.getAmount,
  getAddrList: stores.wanAddress.getAddrList,
  addAddress: (newAddr) => stores.wanAddress.addAddress(newAddr),
  updateBalance: (newBalanceArr) => stores.wanAddress.updateBalance(newBalanceArr)
}))

@observer
class WanAccount extends Component {
  state = {
    bool: true
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
    render: () => <div><SendNormalTrans /></div>
  }];

  componentDidMount() {
    this.timer = setInterval(() => {
      const promises = Object.keys(this.props.addrInfo).map(item => () => getWanBalance(item));
      const series = promises.reduce(accumulator, Promise.resolve([]));

      series.then(res => {
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
    this.setState({
      visible: true
    })
  }

  creatAccount = () => {
    const { addrInfo, addAddress } = this.props;
    const addrLen = Object.keys(addrInfo).length;
    this.setState({
      bool: false
    });
    if(this.state.bool) {
      ipcRenderer.once('address_got', async (event, ret) => {
        let addressInfo = ret.addresses[0];
        let result = await getWanBalance(`0x${addressInfo.address}`);
        addressInfo.balance = result[`0x${addressInfo.address}`];
        addAddress(addressInfo);
        this.setState({
          bool: true
        });
      })
      createWanAccount(windowCurrent, addrLen, addrLen + 1);
    }
  }

  unlockHD = async () => {
    let isUnlock = await unlockHDWallet('123');
    console.log(isUnlock, 'isUnlock')
  }

  render() {
    const { getAmount } = this.props;

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
            <Table className="content-wrap" pagination={false} columns={this.columns} dataSource={this.props.getAddrList} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default WanAccount;