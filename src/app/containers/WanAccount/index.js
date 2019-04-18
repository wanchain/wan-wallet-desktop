import React, { Component } from 'react';
import { Button, Table, Row, Col } from 'antd';
import { remote } from 'electron';
import { observer, inject } from 'mobx-react';

import './index.less';
import { accumulator } from 'utils/support';
import SendNormalTrans from 'components/SendNormalTrans';
import CopyAndQrcode from 'components/CopyAndQrcode';

const { unlockHDWallet, createAddress, getBalance } = remote.require('./controllers')

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
    bool: true,
  }

  columns = [
    {
      title: 'Name',
      dataIndex: 'name',
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
    this.updateBalance()
  }

  componentDidMount() {
    this.timer = setInterval(() => this.updateBalance(), 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  updateBalance = () => {
    const promises = Object.keys(this.props.addrInfo).map(item => () => getBalance('WAN', item));
    const series = promises.reduce(accumulator, Promise.resolve([]));

    series.then(res => {
      if(res.length) {
        this.props.updateBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
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
      createAddress(addrLen, addrLen + 1).then(async ret => {
        if(ret.code) {
          let addressInfo = ret.result.addresses[0];
          let balance = await getBalance('WAN', `0x${addressInfo.address}`);
          addressInfo.start = addressInfo.index;
          addressInfo.wanaddr = `0x${addressInfo.address}`;
          addressInfo.balance = balance[addressInfo.wanaddr];
          addAddress(addressInfo);
          this.setState({
            bool: true
          });
        }
      });
    }
  }

  unlockHD = () => {
    let isUnlock = unlockHDWallet('123');
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