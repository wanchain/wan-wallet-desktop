import React, { Component } from 'react';
import { Button, Input, message, Modal } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { openScanOTA } from 'utils/helper';

import './index.less';

message.config({
  duration: 2,
  maxCount: 1
});
const WAN = "m/44'/5718350'/0'/0/";

@inject(stores => ({
  auth: stores.session.auth,
  language: stores.languageIntl.language,
  addrInfo: stores.wanAddress.addrInfo,
  updateUserAccountDB: () => stores.wanAddress.updateUserAccountDB(),
  setAuth: val => stores.session.setAuth(val),
}))

@observer
class Login extends Component {
  state = {
    pwd: '',
    visible: false
  }

  componentDidMount () {
    document.querySelector('.ant-input').focus();
  }

  login = () => {
    const pwd = this.state.pwd;
    wand.request('wallet_lock', () => {
      wand.request('wallet_unlock', { pwd: pwd }, async (err, val) => {
        if (err) {
          message.error(intl.get('Login.wrongPassword'))
          return;
        }
        this.props.setAuth(true);
        // If the user DB is not the latest version, update user account DB
        if (typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'version')) {
          await this.props.updateUserAccountDB(val.version);
        }
        // Open scanner to scan the smart contract to get private tx balance.
        const normalObj = Object.values(this.props.addrInfo['normal']).map(item => [1, `${WAN}${item.path}`]);
        const importObj = Object.values(this.props.addrInfo['import']).map(item => [5, `${WAN}${item.path}`]);
        openScanOTA(normalObj.concat(importObj));
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
          <Input.Password placeholder={intl.get('Login.inputPassword')} onPressEnter={this.login} onChange={this.handleChange} autoFocus/>
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
