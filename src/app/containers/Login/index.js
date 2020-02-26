import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Modal } from 'antd';

import style from './index.less';
import { BTCPATH_TEST, WANPATH } from 'utils/settings';
import { openScanOTA, createBTCAddr } from 'utils/helper';

message.config({
  duration: 2,
  maxCount: 1
});

@inject(stores => ({
  auth: stores.session.auth,
  btcPath: stores.btcAddress.btcPath,
  addrInfo: stores.wanAddress.addrInfo,
  language: stores.languageIntl.language,
  btcAddrInfo: stores.btcAddress.addrInfo,
  isFirstLogin: stores.session.isFirstLogin,
  setAuth: val => stores.session.setAuth(val),
  setIsFirstLogin: val => stores.session.setIsFirstLogin(val),
  addAddress: newAddr => stores.btcAddress.addAddress(newAddr),
  updateUserAccountDB: () => stores.wanAddress.updateUserAccountDB()
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
        if (this.props.isFirstLogin) {
          this.props.setIsFirstLogin(false);
        }
        this.props.setAuth(true);
        // If the user DB is not the latest version, update user account DB
        if (typeof val === 'object' && Object.prototype.hasOwnProperty.call(val, 'version')) {
          await this.props.updateUserAccountDB(val.version);
        }
        // Open scanner to scan the smart contract to get private tx balance.
        const normalObj = Object.values(this.props.addrInfo['normal']).map(item => [1, `${WANPATH}${item.path}`]);
        const importObj = Object.values(this.props.addrInfo['import']).map(item => [5, `${WANPATH}${item.path}`]);
        openScanOTA(normalObj.concat(importObj));

        if (!Object.keys(this.props.btcAddrInfo.normal).length) {
          createBTCAddr(this.props.btcPath, 0).then(addressInfo => {
            this.props.addAddress(addressInfo);
          }).catch(err => {
            console.log(err);
          })
        }
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
      <div className={style.loginW}>
        <div className={style.loginCon}>
          <Input.Password placeholder={intl.get('Login.inputPassword')} onPressEnter={this.login} onChange={this.handleChange} autoFocus/>
          <Button type="primary" onClick={this.login}>{intl.get('Login.login')}</Button>
          <p className={style.restoreBtn} onClick={this.handleClick}>{intl.get('Login.restore')}</p>
        </div>
        <Modal
          destroyOnClose={true}
          title={intl.get('Restore.restoreFromSeedPhrase')}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.resetStateVal}
          closable={false}
          okText={intl.get('Common.ok')}
          cancelText={intl.get('Common.cancel')}
        >
          <p className="textP">{intl.get('Common.warning')}: {intl.get('Restore.allLocalDataWillBeLost')}</p>
        </Modal>
      </div>
    );
  }
}

export default Login;
