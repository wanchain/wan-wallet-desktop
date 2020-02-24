import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import style from './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class AddDApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddForm: true
    }
    this.props.changeTitle('DApp.addTitle');
  }

  render() {
    return (<div className={style.root}>
      <div className={style.termOfService}></div>
      <div className={style.checkBox}></div>
      <div className={style.button}></div>
    </div>);
  }
}

export default AddDApp;
