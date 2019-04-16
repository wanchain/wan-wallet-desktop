import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import { Layout, Portfolio, WanAccount, Settings, Trezor } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <HashRouter>
        <Main>
          <Switch>
            <Route exact path="/" component={Portfolio} />
            <Route path="/wanaccount" component={WanAccount} />
            <Route path="/settings" component={Settings} />
            <Route path="/trezor" component={Trezor} />
          </Switch>
        </Main>      
      </HashRouter>
  );
};