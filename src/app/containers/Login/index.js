import React, { Component } from 'react';
import { Button, Input, message, Modal } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  language: stores.languageIntl.language,
  setAuth: val => stores.session.setAuth(val),
}))

@observer
class Login extends Component {
  state = {
    pwd: '',
    visible: false
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

  handleClick = () => {
    this.setState({
      visible: true
    })
  }

  resetStateVal = () => {
    this.setState({
      visible: false,
    });
  }

  handleOk = () => {
    wand.request('phrase_reset', null, () => {});
  }

  render () {
    return (
      <div className="loginW">
        <div className="loginCon">
          <Input.Password placeholder={intl.get('Login.inputPassword')} onPressEnter={this.login} onChange={this.handleChange}/>
          <Button type="primary" onClick={this.login}>{intl.get('Login.login')}</Button>
          <p className="restoreBtn" onClick={this.handleClick}>{intl.get('Login.restore')}</p>
        </div>
        <Modal
          destroyOnClose={true}
          title={intl.get('Restore.restoreFromSeedPhrase')}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.resetStateVal}
          closable={false}
          okText={intl.get('popup.ok')}
          cancelText={intl.get('popup.cancel')}
        >
          <p className="textP">{intl.get('Restore.warning')}: {intl.get('Restore.allLocalDataWillBeLost')}</p>
        </Modal>
      </div>
    );
  }
}

export default Login;
