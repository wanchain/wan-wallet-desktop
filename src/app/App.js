import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { AppContainer } from 'react-hot-loader';
import { initEmitterHandler } from 'utils/helper';

import './global.less';
import Router from './Routes';
import stores from './stores';

class App extends Component {
  constructor(props) {
    super(props);
    stores.session.initChainId();
    stores.portfolio.updateCoinPrice();
    stores.wanAddress.getUserAccountFromDB();
    initEmitterHandler();
  }

  render() {
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