import React, { Component } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import { isSdkReady } from 'utils/helper';

import './Layout.less';
import SideBar from './Sidebar';
import Register from './Register';
import Login from 'containers/Login';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';
import Loading from 'components/Loading';


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

  waitUntilSdkReady() {
    let id = setInterval(async () => {
      let ready = await isSdkReady();
      if (ready) {
        try {
          await this.props.getMnemonic();
          this.setState({
            loading: false
          });
          console.log('SDK is ready');
          clearInterval(id);
        } catch (err) {
          console.log('Get mnemonic failed');
        }
      }
    }, 1000);
  }

  componentDidMount() {
    this.wanTimer = setInterval(() => this.updateWANBalanceForInter(), 5000);
    this.waitUntilSdkReady();
  }

  componentWillUnmount() {
    clearInterval(this.wanTimer);
  }

  updateWANBalanceForInter = () => {
    const { addrInfo } = this.props;
    const allAddr = (Object.values(addrInfo).map(item => Object.keys(item))).flat();
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
    const { hasMnemonicOrNot, auth, location } = this.props;
    if (this.state.loading) {
      return <Loading />
    } else {
      if (!hasMnemonicOrNot) {
        return <Register />;
      } else if (!auth) {
        return <Login />
      } else {
        return (
          <Row className="container">
            <Col /* span={4} */ className="nav-left">
              <SideBar path={location.pathname}/>
            </Col>
            <Col /* span={20} */ className="main">
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