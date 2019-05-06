import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { AppContainer } from 'react-hot-loader';

import './global.less';
import Router from './Routes';
import stores from './stores';
import { initEmitterHandler } from 'utils/helper';

class App extends Component {
  componentWillMount() {
    stores.session.getMnemonic();
    stores.session.initChainId();
    stores.wanAddress.getUserAccountFromDB();
    stores.portfolio.updateCoinPrice();
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