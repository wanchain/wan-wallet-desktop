import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import { Layout, Portfolio, WanAccount, Settings, Trezor, Ledger, Staking, Validator } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <HashRouter>
        <Main>
          <Switch>
            <Route exact path="/" component={Portfolio} />
            <Route path="/wanaccount" component={WanAccount} />
            <Route path="/settings" component={Settings} />
            {/* TODO */}
            {/* <Route path="/trezor" component={Trezor} /> */}
            <Route path="/ledger" component={Ledger} />
            <Route path="/staking" component={Staking} />
            <Route path="/validator" component={Validator} />
          </Switch>
        </Main>      
      </HashRouter>
  );
};