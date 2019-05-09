import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  setAuth: val => stores.session.setAuth(val)
}))

@observer
class Login extends Component {
  unlock = () => {
    wand.request('wallet_unlock', { pwd: '123' }, (err, val) => {
      if (err) {
        console.log('error printed inside callback: ', err);
        return;
      } 
      this.props.setAuth(true)
    })
  }
  render () {

    return (
      <div className="header">
        <div className="loginCon">
          <input />
          <button onClick={this.unlock}>解锁</button>
        </div>
      </div>
    );
  }
}

export default Login;
