import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import { Layout, Portfolio, WanAccount, Settings, Trezor, Ledger, Delegation, Validator, Offline, TokenTrans, EthAccount, BtcAccount, CrossETH, CrossE20, CrossBTC } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <HashRouter>
        <Main>
          <Switch>
            <Route exact path="/" component={Portfolio} />
            <Route path="/wanAccount" component={WanAccount} />
            <Route path="/ethaccount" component={EthAccount} />
            <Route path="/btcaccount" component={BtcAccount} />
            <Route path="/crossETH" component={CrossETH} />
            <Route path="/crossBTC" component={CrossBTC} />
            <Route path="/settings" component={Settings} />
            <Route path="/trezor" component={Trezor} />
            <Route path="/ledger" component={Ledger} />
            <Route path="/offline" component={Offline} />
            <Route path="/delegation" component={Delegation} />
            <Route path="/validator" component={Validator} />
            <Route path="/tokens/:tokenAddr/:symbol" component={TokenTrans} />
            <Route path="/crossChain/:tokenAddr/:symbol" component={CrossE20} />
          </Switch>
        </Main>
      </HashRouter>
  );
};
