import React, { Component } from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import { HashRouter } from 'react-router-dom';
import { AppContainer } from 'react-hot-loader';


import './global.css';
import getRoutes from './Routes';
import stores from './stores';


class App extends Component {
  async componentWillMount() {
    await stores.session.getMnemonic();
  }
  
  render() {
      return (
        <AppContainer>
          <Provider {...stores}>
            <HashRouter ref="navigator">
              {getRoutes()}
            </HashRouter>
          </Provider>
        </AppContainer>
      );
  }
}


render(<App />, document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./Routes', () => {
    const NextApp = require('./Routes').default;
		render(NextApp(), document.getElementById('root'));
  });
}