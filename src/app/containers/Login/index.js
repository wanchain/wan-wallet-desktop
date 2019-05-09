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
  unlock = () => {
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
          <Input.Password placeholder="input password" onPressEnter={this.unlock} onChange={this.handleChange}/>
          <Button onClick={this.unlock}>unlock</Button>
        </div>
      </div>
    );
  }
}

export default Login;
