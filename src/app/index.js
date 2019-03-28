import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';

const wrapApp = AppComponent => (
  <AppContainer>
    <AppComponent />
  </AppContainer>
);

render(wrapApp(Root), document.getElementById('root'));

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextApp = require('./containers/Root').default;
		render(wrapApp(NextApp), rootEl);
  });
}