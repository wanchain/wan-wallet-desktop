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
  MoreAccount,
  EthAccount,
  BtcAccount,
  EosAccount,
  XrpAccount,
  CrossChain,
  CrossWAN,
  CrossETH,
  CrossBTC,
  CrossEOS,
  CrossXRP,
  MoreCrossChain,
  DApps,
  DAppMarket,
  OsmDelegation,
  OsmStoreman,
  AddDApp
} from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
    <HashRouter>
      <Main>
        <Switch>
          <Route exact path="/" component={Portfolio} />
          <Route path="/wanAccount" component={WanAccount} />
          <Route path="/btcAccount" component={BtcAccount} />
          <Route path="/ethAccount" component={EthAccount} />
          <Route path="/eosAccount" component={EosAccount} />
          <Route path="/xrpAccount" component={XrpAccount} />
          <Route path="/tokens/:chain/:tokenAddr/:symbol" component={TokenTrans} />
          <Route path="/MoreAccount" component={MoreAccount} />
          <Route path="/crossChain/:tokenPairId" component={CrossChain} />
          <Route path="/crossWAN/:tokenPairId" component={CrossWAN} />
          <Route path="/crossETH/:tokenPairId" component={CrossETH} />
          <Route path="/crossBTC/:tokenPairId" component={CrossBTC} />
          <Route path="/crossEOS/:tokenPairId" component={CrossEOS} />
          <Route path="/crossXRP/:tokenPairId" component={CrossXRP} />
          <Route path="/moreCrossChain" component={MoreCrossChain} />
          <Route path="/settings" component={Settings} />
          <Route path="/trezor" component={Trezor} />
          <Route path="/ledger" component={Ledger} />
          <Route path="/offline" component={Offline} />
          <Route path="/delegation" component={Delegation} />
          <Route path="/validator" component={Validator} />
          <Route path="/AddDApp" component={AddDApp} />
          <Route path="/dapp/:url" component={DApps} />
          <Route path="/dAppMarket" component={DAppMarket} />
          <Route path="/osm_delegation" component={OsmDelegation} />
          <Route path="/osm_storeman" component={OsmStoreman} />
        </Switch>
      </Main>
    </HashRouter>
  );
};
