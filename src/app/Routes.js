import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import {
  Layout,
  Portfolio,
  WanAccount,
  Settings,
  Trezor,
  Ledger,
  Delegation,
  Validator,
  Offline,
  TokenTrans,
  E20TokenTrans,
  MoreAccount,
  EthAccount,
  BtcAccount,
  EosAccount,
  CrossChain,
  CrossETH,
  CrossE20,
  CrossBTC,
  CrossEOS,
  MoreCrossChain,
  DApps,
  DAppMarket,
  AddDApp
} from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
    <HashRouter>
      <Main>
        <Switch>
          <Route exact path="/" component={Portfolio} />
          <Route path="/btcAccount/:symbol" component={BtcAccount} />
          <Route path="/ethAccount/:symbol/:chain" component={EthAccount} />
          <Route path="/MoreAccount" component={MoreAccount} />
          {/* <Route path="/wanAccount" component={WanAccount} />
          <Route path="/ethAccount" component={EthAccount} />
          <Route path="/btcAccount" component={BtcAccount} />
          <Route path="/eosAccount" component={EosAccount} /> */}
          <Route path="/crosschain/:key/:symbol/:address" component={CrossChain} />
          <Route path="/crossETH" component={CrossETH} />
          <Route path="/crossBTC" component={CrossBTC} />
          <Route path="/crossEOS" component={CrossEOS} />
          <Route path="/moreCrossChain" component={MoreCrossChain} />
          <Route path="/settings" component={Settings} />
          <Route path="/trezor" component={Trezor} />
          <Route path="/ledger" component={Ledger} />
          <Route path="/offline" component={Offline} />
          <Route path="/delegation" component={Delegation} />
          <Route path="/validator" component={Validator} />
          <Route path="/tokens/WAN/:tokenAddr/:symbol" component={TokenTrans} />
          <Route path="/tokens/ETH/:tokenAddr/:symbol" component={E20TokenTrans} />
          <Route path="/crossChain/ETH/:tokenAddr/:symbol" component={CrossE20} />
          <Route path="/crossChain/EOS/:tokenAddr/:symbol" component={CrossEOS} />
          <Route path="/AddDApp" component={AddDApp} />
          <Route path="/dapp/:url" component={DApps} />
          <Route path="/dAppMarket" component={DAppMarket} />
        </Switch>
      </Main>
    </HashRouter>
  );
};
