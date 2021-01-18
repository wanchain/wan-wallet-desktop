import React, { Component, Suspense } from 'react';
import { observer, inject } from 'mobx-react';
import { isSdkReady, getBalanceWithPrivateBalance, getBalance, getBTCMultiBalances, getEosAccountInfo } from 'utils/helper';
import Loading from 'components/Loading';
import { WANPATH } from 'utils/settings';
import Transition from 'components/Transition';

const Login = React.lazy(() => import(/* webpackChunkName:'LoginPage' */'containers/Login'));
const Register = React.lazy(() => import(/* webpackChunkName:'RegisterPage' */'containers/Register'));
const Main = React.lazy(() => import(/* webpackChunkName:'MainPage' */'containers/Main'));

@inject(stores => ({
  auth: stores.session.auth,
  addrInfo: stores.wanAddress.addrInfo,
  ethAddrInfo: stores.ethAddress.addrInfo,
  btcAddrInfo: stores.btcAddress.addrInfo,
  xrpAddrInfo: stores.xrpAddress.addrInfo,
  accountInfo: stores.eosAddress.accountInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  getMnemonic: () => stores.session.getMnemonic(),
  checkUpdateDB: () => stores.session.checkUpdateDB(),
  getTokensInfo: () => stores.tokens.getTokensInfo(),
  getTokenPairs: () => stores.crossChain.getTokenPairs(),
  updateUtxos: newUtxos => stores.btcAddress.updateUtxos(newUtxos),
  updateWANBalance: newBalanceArr => stores.wanAddress.updateWANBalance(newBalanceArr),
  updateETHBalance: newBalanceArr => stores.ethAddress.updateETHBalance(newBalanceArr),
  updateBTCBalance: newBalanceArr => stores.btcAddress.updateBTCBalance(newBalanceArr),
  updateEOSBalance: newBalanceArr => stores.eosAddress.updateEOSBalance(newBalanceArr),
  updateXRPBalance: newBalanceArr => stores.xrpAddress.updateXRPBalance(newBalanceArr),
  updateUserAccountDB: (...args) => stores.wanAddress.updateUserAccountDB(...args)
}))

@observer
class Layout extends Component {
  state = {
    loading: true,
    initializeStep: '',
  }

  componentDidMount() {
    this.wanTimer = setInterval(() => {
      this.updateWANBalanceForInter();
      this.updateETHBalanceForInter();
      this.updateBTCBalanceForInter();
      this.updateEOSBalanceForInter();
      this.updateXRPBalanceForInter();
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
      initializeStep: 'Layout.connecting'
    });
    let running = false;
    let id = setInterval(async () => {
      if (running) {
        return false;
      }
      let ready = false;
      try {
        ready = await isSdkReady();
        this.setState({
          initializeStep: 'Layout.connected'
        });
      } catch (e) {
        console.log('isSdkReady err', e);
        this.setState({
          initializeStep: 'Layout.initSDKFailed'
        });
      }
      if (ready) {
        try {
          running = true;
          let version = await this.props.checkUpdateDB();
          await this.props.getMnemonic();
          // If the user DB is not the latest version, update user account DB
          if (version !== true) {
            await this.props.updateUserAccountDB(version);
          }
          await this.props.getTokensInfo();
          await this.props.getTokenPairs();
          this.setState({
            initializeStep: 'Layout.initSuccess',
            loading: false
          });
          clearInterval(id);
          running = false;
        } catch (err) {
          running = false;
          console.log('error occurred.', err)
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

  updateXRPBalanceForInter = () => {
    const { xrpAddrInfo } = this.props;
    const allAddr = (Object.values(xrpAddrInfo).map(item => Object.keys(item))).flat();
    if (Array.isArray(allAddr) && allAddr.length === 0) return;
    getBalance(allAddr, 'XRP').then(res => {
      if (res && Object.keys(res).length) {
        this.props.updateXRPBalance(res);
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

  render() {
    const { hasMnemonicOrNot, auth, location } = this.props;
    if (this.state.loading) {
      return <Loading step={this.state.initializeStep} />
    } else {
      if (!hasMnemonicOrNot) {
        return <Suspense fallback={<Transition/>}><Register /></Suspense>;
      } else if (!auth) {
        return <Suspense fallback={<Transition/>}><Login /></Suspense>
      } else {
      return <Suspense fallback={<Transition/>}><Main>{this.props.children}</Main></Suspense>
      }
    }
  }
}

export default Layout;
