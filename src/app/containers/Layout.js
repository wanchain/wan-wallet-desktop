import React, { Component } from 'react';
import { Row, Col, Spin } from 'antd';
import { observer, inject } from 'mobx-react';
import { promiseTimeout } from 'utils/support';

import './Layout.less';
import SideBar from './Sidebar';
import Register from './Register';
import Login from 'containers/Login';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';

import { getBalance } from 'utils/helper';

@inject(stores => ({
  auth: stores.session.auth,
  addrInfo: stores.wanAddress.addrInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: () => stores.session.getMnemonic(),
  updateWANBalance: newBalanceArr => stores.wanAddress.updateWANBalance(newBalanceArr),
}))

@observer
export default class Layout extends Component {
  state = {
    loading: true
  }

  async waitUntilSdkReady() {
    try {
      let ret = await promiseTimeout(1000, this.props.getMnemonic(), 'timeout');
      if (ret) {
        this.setState({
          loading: false
        });
      }
    } catch (err) {
      console.log('SDK is not ready', err);
      this.waitUntilSdkReady();
    }
  }

  componentDidMount() {
    this.wantimer = setInterval(() => this.updateWANBalanceForInter(), 5000);
    this.waitUntilSdkReady();
  }

  componentWillUnmount() {
    clearInterval(this.wantimer);
  }

  updateWANBalanceForInter = () => {
    const { addrInfo } = this.props;
    const allAddr = Object.keys(addrInfo['normal']).concat(Object.keys(addrInfo['ledger'])).concat(Object.keys(addrInfo['trezor']))
    if (Array.isArray(allAddr) && allAddr.length === 0) return;
    getBalance(allAddr).then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateWANBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  render() {
    const { hasMnemonicOrNot, auth } = this.props;
    if (this.state.loading) {
      return <Spin size="large" />
    } else {
      if (!hasMnemonicOrNot) {
        return <Register />;
      } else if (!auth) {
        return <Login />
      } else {
        return (
          <Row className="container">
            <Col span={4} className="nav-left">
              <SideBar />
            </Col>
            <Col span={20} className="main">
              <MHeader />
              <Row className="content">
                {this.props.children}
              </Row>
              <MFooter />
            </Col>
          </Row>
        )
      }
    }
  }
}