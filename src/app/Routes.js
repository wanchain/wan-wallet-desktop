import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import routes from 'constants/routes';
import App from 'containers/App';
import portfolio from 'containers/portfolio/portfolio';

export default () => (
  <Router>
    <App>
      <Switch>
        <Route path={routes.PORTFOLIO} component={portfolio} />
      </Switch>
    </App>
  </Router>
);