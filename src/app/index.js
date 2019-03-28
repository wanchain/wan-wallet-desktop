import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './app';

const wrapApp = AppComponent => (
  <AppContainer>
    <AppComponent />
  </AppContainer>
);

render(wrapApp(App), document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = require('./app').default;
		render(wrapApp(NextApp), rootEl);
  });
}