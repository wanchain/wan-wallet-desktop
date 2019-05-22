import React, { Component } from 'react';
import { Button, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  setAuth: val => stores.session.setAuth(val),
  language: stores.session.language,
}))

@observer
class Login extends Component {
  state = {
    pwd: ''
  }

  login = () => {
    const pwd = this.state.pwd;
    wand.request('wallet_lock', () => {
      wand.request('wallet_unlock', { pwd: pwd }, (err, val) => {
        if (err) {
          message.error(intl.get('Login.wrongPassword'))
          return;
        } 
        this.props.setAuth(true);
      })
    })
  }

  handleChange = (e) => {
    this.setState({
      pwd: e.target.value
    })
  }

  render () {
    return (
      <div className="loginW">
        <div className="loginCon">
          <Input.Password placeholder={intl.get('Login.inputPassword')} onPressEnter={this.login} onChange={this.handleChange}/>
          <Button type="primary" onClick={this.login}>{intl.get('Login.login')}</Button>
        </div>
      </div>
    );
  }
}

export default Login;
