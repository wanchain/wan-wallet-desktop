import React, { Component } from 'react';
import { Button, Input, message } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  setAuth: val => stores.session.setAuth(val)
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
          message.error('Wrong Password')
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
          <Input.Password placeholder="Input Password" onPressEnter={this.login} onChange={this.handleChange}/>
          <Button type="primary" onClick={this.login}>LOG IN</Button>
        </div>
      </div>
    );
  }
}

export default Login;
