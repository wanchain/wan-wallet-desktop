import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './containers/index.js';

const wrapApp = AppComponent => (
  <AppContainer>
    <AppComponent />
  </AppContainer>
);

render(wrapApp(App), document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./containers/index', () => {
    const NextApp = require('./containers/index').default;
		render(wrapApp(NextApp), rootEl);
  });
}