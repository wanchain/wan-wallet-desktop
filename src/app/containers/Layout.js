import React, { Component, Suspense } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import { getBalance, isSdkReady, getBalanceWithPrivateBalance, getEthBalance } from 'utils/helper';

import './Layout.less';
import SideBar from './Sidebar';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';
import Loading from 'components/Loading';
import { WANPATH } from 'utils/settings';

const Login = React.lazy(() => import(/* webpackChunkName:'LoginPage' */'containers/Login'));
const Register = React.lazy(() => import(/* webpackChunkName:'RegisterPage' */'containers/Register'));

@inject(stores => ({
  auth: stores.session.auth,
  addrInfo: stores.wanAddress.addrInfo,
  ethAddrInfo: stores.ethAddress.addrInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: () => stores.session.getMnemonic(),
  getTokensInfo: () => stores.tokens.getTokensInfo(),
  updateWANBalance: newBalanceArr => stores.wanAddress.updateWANBalance(newBalanceArr),
  updateETHBalance: newBalanceArr => stores.ethAddress.updateETHBalance(newBalanceArr),
}))

@observer
class Layout extends Component {
  state = {
    loading: true,
    collapsed: false
  }

  componentDidMount () {
    this.wanTimer = setInterval(() => {
      this.updateWANBalanceForInter();
      this.updateETHBalanceForInter();
    }, 5000);
    this.waitUntilSdkReady();
  }

  componentDidUpdate (prevProps) {
    if (this.props.location !== prevProps.location) {
      document.getElementById('main-content').scrollTo(0, 0);
    }
  }

  componentWillUnmount () {
    clearInterval(this.wanTimer);
  }

  waitUntilSdkReady () {
    let id = setInterval(async () => {
      let ready = await isSdkReady();
      if (ready) {
        try {
          await this.props.getTokensInfo();
          await this.props.getMnemonic();
          this.setState({
            loading: false
          });
          clearInterval(id);
        } catch (err) {
          console.log('Get mnemonic failed');
        }
      }
    }, 3000);
  }

  updateWANBalanceForInter = () => {
    const { addrInfo } = this.props;
    const allAddr = (Object.values(addrInfo).map(item => Object.keys(item))).flat();
    const normalObj = Object.values(addrInfo['normal']).map(item => [1, `${WANPATH}${item.path}`, `${item.address}`]);
    const importObj = Object.values(addrInfo['import']).map(item => [5, `${WANPATH}${item.path}`, `${item.address}`]);
    let allPrivatePath = normalObj.concat(importObj);
    allPrivatePath = allPrivatePath.length > 0 ? allPrivatePath : undefined;
    if (Array.isArray(allAddr) && allAddr.length === 0) return;
    getBalanceWithPrivateBalance(allAddr, allPrivatePath).then(res => {
      if (res && (Object.keys(res.balance).length || Object.keys(res.privateBalance).length)) {
        this.props.updateWANBalance(res);
      }
    }).catch(err => {
      console.log('Update WAN balance failed');
      console.log(err);
    });
  }

  updateETHBalanceForInter = () => {
    const { ethAddrInfo } = this.props;
    const allAddr = (Object.values(ethAddrInfo).map(item => Object.keys(item))).flat();
    if (Array.isArray(allAddr) && allAddr.length === 0) return;
    getEthBalance(allAddr).then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateETHBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  toggleNav = () => {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }

  render () {
    const { hasMnemonicOrNot, auth, location } = this.props;
    if (this.state.loading) {
      return <Loading />
    } else {
      if (!hasMnemonicOrNot) {
        return <Suspense fallback={<div>Loading...</div>}><Register /></Suspense>;
      } else if (!auth) {
        return <Suspense fallback={<div>Loading......</div>}><Login /></Suspense>
      } else {
        return (
          <Row className="container">
            <Col className={'nav-left ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
              <SideBar handleNav={this.toggleNav} path={location.pathname}/>
            </Col>
            <Col id="main-content" className={'main ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
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

export default Layout;
