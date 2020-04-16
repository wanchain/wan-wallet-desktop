import React, { Component, Suspense } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';
import { isSdkReady, getBalanceWithPrivateBalance, getBalance, getBTCMultiBalances, getEosAccountInfo, initRegTokens } from 'utils/helper';

import style from './Layout.less';
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
  btcAddrInfo: stores.btcAddress.addrInfo,
  accountInfo: stores.eosAddress.accountInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: () => stores.session.getMnemonic(),
  getTokensInfo: () => stores.tokens.getTokensInfo(),
  getCcTokensInfo: () => stores.tokens.getCcTokensInfo(),
  updateUtxos: newUtxos => stores.btcAddress.updateUtxos(newUtxos),
  updateWANBalance: newBalanceArr => stores.wanAddress.updateWANBalance(newBalanceArr),
  updateETHBalance: newBalanceArr => stores.ethAddress.updateETHBalance(newBalanceArr),
  updateBTCBalance: newBalanceArr => stores.btcAddress.updateBTCBalance(newBalanceArr),
  updateEOSBalance: newBalanceArr => stores.eosAddress.updateEOSBalance(newBalanceArr),
}))

@observer
class Layout extends Component {
  state = {
    loading: true,
    collapsed: false,
    initializeStep: ''
  }

  componentDidMount() {
    this.wanTimer = setInterval(() => {
      this.updateWANBalanceForInter();
      this.updateETHBalanceForInter();
      this.updateBTCBalanceForInter();
      this.updateEOSBalanceForInter();
    }, 5000);
    this.waitUntilSdkReady();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) {
      document.getElementById('main-content').scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    clearInterval(this.wanTimer);
  }

  waitUntilSdkReady() {
    this.setState({
      initializeStep: 'Layout.waitingForSDK'
    });
    let id = setInterval(async () => {
      let ready = false;
      try {
        ready = await isSdkReady();
        this.setState({
          initializeStep: 'Layout.SDKIsReady'
        });
      } catch (e) {
        this.setState({
          initializeStep: 'Layout.initSDKFailed'
        });
      }
      if (ready) {
        try {
          await initRegTokens('ETH');
          await initRegTokens('EOS');
          await this.props.getTokensInfo();
          await this.props.getCcTokensInfo();
          await this.props.getMnemonic();
          this.setState({
            initializeStep: 'Layout.initSuccess',
            loading: false
          });
          clearInterval(id);
        } catch (err) {
          this.setState({
            initializeStep: 'Layout.initFailed',
          });
        }
      }
    }, 3000);
  }

  updateWANBalanceForInter = () => {
    const { addrInfo } = this.props;
    const allAddr = (Object.values(addrInfo).map(item => Object.keys(item))).flat();
    const normalObj = Object.values(addrInfo['normal']).map(item => [1, `${WANPATH}${item.path}`, `${item.address}`]);
    const importObj = Object.values(addrInfo['import']).map(item => [5, `${WANPATH}${item.path}`, `${item.address}`]);
    const rawKeyObj = Object.values(addrInfo['rawKey']).map(item => [6, `${WANPATH}${item.path}`, `${item.address}`]);
    let allPrivatePath = normalObj.concat(importObj).concat(rawKeyObj);
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
    getBalance(allAddr, 'ETH').then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateETHBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  updateBTCBalanceForInter = () => {
    const { btcAddrInfo } = this.props;
    const allAddr = (Object.values(btcAddrInfo).map(item => Object.keys(item))).flat();
    if (Array.isArray(allAddr) && allAddr.length === 0) return;
    getBTCMultiBalances(allAddr).then(res => {
      if (res.btcMultiBalances && Object.keys(res.btcMultiBalances).length) {
        this.props.updateUtxos(res.utxos);
        this.props.updateBTCBalance(res.btcMultiBalances);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  updateEOSBalanceForInter = () => {
    const { accountInfo } = this.props;
    const allAccounts = Object.keys(accountInfo);
    if (Array.isArray(allAccounts) && allAccounts.length === 0) return;
    getEosAccountInfo(allAccounts).then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateEOSBalance(res);
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

  render() {
    const { hasMnemonicOrNot, auth, location } = this.props;
    const showHeader = !(location.pathname.includes('dapp') || location.pathname.includes('AddDApp'));
    if (this.state.loading) {
      return <Loading step={this.state.initializeStep} />
    } else {
      if (!hasMnemonicOrNot) {
        return <Suspense fallback={<div>Loading...</div>}><Register /></Suspense>;
      } else if (!auth) {
        return <Suspense fallback={<div>Loading......</div>}><Login /></Suspense>
      } else {
        return (
          <Row className="container">
            <Col className={style['nav-left'] + ' ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
              <SideBar handleNav={this.toggleNav} path={location.pathname} />
            </Col>
            <Col id="main-content" className={'main ' + (this.state.collapsed ? 'nav-collapsed' : '')}>
              {showHeader ? <MHeader /> : null}
              <Row className="content">
                {this.props.children}
              </Row>
              {showHeader ? <MFooter /> : null}
            </Col>
          </Row>
        )
      }
    }
  }
}

export default Layout;
