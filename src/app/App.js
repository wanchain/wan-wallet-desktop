import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { message } from 'antd';
import { AppContainer } from 'react-hot-loader';
import intl from 'react-intl-universal';

import './global.less';
import Router from './Routes';
import stores from './stores';
import locales from './locales';
import OneStep from 'utils/OneStep';
import { initEmitterHandler, regEmitterHandler, isSdkReady, getAllUndoneCrossTrans } from 'utils/helper';

class App extends Component {
  constructor (props) {
    super(props);
    this.changeLanguage('en_US');
    initEmitterHandler();
    let id = setInterval(async () => {
      let ready = await isSdkReady();
      if (ready) {
        stores.session.initChainId().then(chainId => stores.btcAddress.getUserAccountFromDB(chainId));
        stores.session.initSettings();
        stores.portfolio.updateCoinPrice();
        stores.wanAddress.getUserAccountFromDB();
        stores.ethAddress.getUserAccountFromDB();
        stores.eosAddress.getUserKeyFromDB();
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
        stores.wanAddress.updateAddress(['ledger', 'trezor']);
        stores.wanAddress.updateTransHistory(true);
        stores.session.setIsFirstLogin(true)
      })
    });

    regEmitterHandler('keyfilepath', data => {
      stores.wanAddress.addKeyStoreAddr(data);
    })

    this.timer = setInterval(() => {
      // Handle one step cross chain and undo cross chain trans
      if (!stores.session.isFirstLogin) {
        console.log('<<<<<<<< Handle Undo Cross Chain Trans >>>>>>>>>')
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
