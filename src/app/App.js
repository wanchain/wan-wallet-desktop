import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { message } from 'antd';
import { AppContainer } from 'react-hot-loader';
import intl from 'react-intl-universal';
import Router from './Routes';
import stores from './stores';
import locales from './locales';
import OneStep from 'utils/OneStep';
import { initEmitterHandler, regEmitterHandler, isSdkReady, getAllUndoneCrossTrans } from 'utils/helper';
import './global.less';

class App extends Component {
  constructor (props) {
    super(props);
    this.changeLanguage('en_US');
    initEmitterHandler();
    let id = setInterval(async () => {
      let ready = await isSdkReady();
      if (ready) {
        stores.session.initChainId();
        stores.session.initNetwork().then(network => stores.btcAddress.getUserAccountFromDB(network));
        stores.session.initSettings();
        stores.wanAddress.getUserAccountFromDB();
        stores.ethAddress.getUserAccountFromDB();
        stores.xrpAddress.getUserAccountFromDB();
        stores.bnbAddress.getUserAccountFromDB();
        stores.eosAddress.getUserKeyFromDB();
        stores.dapps.updateLocalDApps();
        clearInterval(id);
      }
    }, 1000);
  }

  componentDidMount () {
    regEmitterHandler('language', (val) => {
      let lng;
      switch (val) {
        case 'en':
          lng = 'en_US';
          break;
        case 'zh':
          lng = 'zh_CN';
          break;
        default:
          lng = val.replace('-', '_');
      }
      this.changeLanguage(lng);
    });

    regEmitterHandler('uiAction', action => {
      if (action === 'lockWallet' && stores.session.auth === true) {
        // wand.request('wallet_lock', null, (err, val) => {
        //   if (err) {
        //     console.log('Lock failed ', err)
        //     return
        //   }
        //   stores.session.setAuth(false);
        // })
        stores.session.setAuth(false);
      }
    });

    regEmitterHandler('hdwallet', val => {
      if (['Ledger', 'Trezor'].includes(val.Device)) {
        message.warn(intl.get('HwWallet.disconnected'));
        wand.request('wallet_deleteLedger');
        stores.wanAddress.updateAddress(val.Device.toLowerCase());
      }
    });

    regEmitterHandler('network', net => {
      wand.request('wallet_lock', null, (err, val) => {
        if (err) {
          console.log('Lock failed ', err)
          return
        }
        stores.session.setAuth(false);
        // stores.tokens.getTokensInfo();
        stores.session.setChainId(net.includes('main') ? 1 : 3);
        stores.session.setNetwork(net);
        stores.wanAddress.updateAddress(['ledger', 'trezor']);
        stores.wanAddress.updateTransHistory(true);
        stores.session.setIsFirstLogin(true)
      })
    });

    regEmitterHandler('keyfilepath', data => {
      stores.wanAddress.addKeyStoreAddr(data);
    })

    regEmitterHandler('importPrivateKey', data => {
      switch (data.type) {
        case 'WAN':
          stores.wanAddress.addRawKey(data);
          break;
        case 'ETH':
          stores.ethAddress.addRawKey(data);
          break;
        case 'BTC':
          stores.btcAddress.addRawKey(data);
          break;
        case 'EOS':
          stores.eosAddress.addRawKey(data);
            break;
        case 'XRP':
          stores.xrpAddress.addRawKey(data);
            break;
      }
    })

    this.timer = setInterval(() => {
      // Handle one step cross chain and undo cross chain trans
      if (!stores.session.isFirstLogin) {
        getAllUndoneCrossTrans((err, ret) => {
          if (!err) {
            OneStep.initUndoTrans(ret).handleRedeem().handleRevoke();
          } else {
            message.warn(intl.get('network.down'));
          }
        })
      }
    }, 10000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  changeLanguage = lan => {
    intl.init({
      currentLocale: lan,
      locales
    }).then(() => {
      stores.languageIntl.setLanguage(lan);
    });
  }

  render () {
    return (
      <AppContainer>
        <Provider {...stores}>
          <Router />
        </Provider>
      </AppContainer>
    );
  }
}

render(<App />, document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./Routes', () => {
    const NextApp = require('./Routes').default;
    render(<NextApp />, document.getElementById('root'));
  });
}
