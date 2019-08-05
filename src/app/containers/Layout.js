import React, { Component, Suspense } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './Layout.less';
import SideBar from './Sidebar';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';
import Loading from 'components/Loading';
import { getBalance, isSdkReady } from 'utils/helper';

const Login = React.lazy(() => import(/* webpackChunkName:'LoginPage' */'containers/Login'));
const Register = React.lazy(() => import(/* webpackChunkName:'RegisterPage' */'containers/Register'));

@inject(stores => ({
  auth: stores.session.auth,
  addrInfo: stores.wanAddress.addrInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: () => stores.session.getMnemonic(),
  updateWANBalance: newBalanceArr => stores.wanAddress.updateWANBalance(newBalanceArr),
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
