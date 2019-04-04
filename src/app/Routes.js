import React from 'react';
import { withRouter, Switch, Route } from 'react-router-dom';
import routes from 'constants/routes';
import { Layout, Portfolio, Sidebar, Wallet } from './containers';

const Main = withRouter(props => <Layout {...props} />);

export default () => {
  return (
      <Main>
        <Switch>
          <Route exact path={routes.PORTFOLIO} component={Portfolio} />
          <Route path={routes.WALLET} component={Wallet} />
        </Switch>
      </Main>
  );
};