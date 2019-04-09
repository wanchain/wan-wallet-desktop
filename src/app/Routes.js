import React from 'react';
import { HashRouter, withRouter, Switch, Route } from 'react-router-dom';
import { Layout, Portfolio, WanAccount } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <HashRouter>
        <Main>
          <Switch>
            <Route exact path="/" component={Portfolio} />
            <Route path="/wanaccount" component={WanAccount} />
          </Switch>
        </Main>      
      </HashRouter>
  );
};