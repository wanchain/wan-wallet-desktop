import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Transition extends Component {
  render() {
    return (
      <div className={style.container}>
        {/* <div className={style.loadingText}>Loading...</div> */}
      </div>
    );
  }
}

export default Transition;
