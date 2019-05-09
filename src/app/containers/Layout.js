import React, { Component } from 'react';
import { Row, Col, Spin } from 'antd';
import { observer, inject } from 'mobx-react';

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
  updateWANBalance: newBalanceArr => stores.wanAddress.updateBalance(newBalanceArr),
}))

@observer
export default class Layout extends Component {
  state = {
    loading: true
  }

  componentDidMount() {
    this.wantimer = setInterval(() => this.updateWANBalanceForInter(), 5000);
    this.props.getMnemonic().then(() => {
      this.setState({
        loading: false
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.wantimer);
  }

  updateWANBalanceForInter = () => {
    const { addrInfo } = this.props;
    const arr = Object.keys(addrInfo).map(item => item.substr(2));
    if(Array.isArray(arr) && arr.length === 0 ) return;
    getBalance(arr).then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateWANBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  render() {
    const { hasMnemonicOrNot, auth } = this.props;
    if(this.state.loading) {
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