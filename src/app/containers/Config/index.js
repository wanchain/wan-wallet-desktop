import React, { Component } from 'react';
import { Checkbox, Card, Select, Form, message, Icon } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import { defaultTimeout } from 'utils/settings';
import AddToken from 'componentUtils/AddToken';
import PasswordConfirmForm from 'components/PasswordConfirmForm';
import ConfirmDeleteToken from './ConfirmDeleteToken';
const { Option } = Select;
const PwdConfirmForm = Form.create({ name: 'PasswordConfirmForm' })(PasswordConfirmForm);
@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  getTokenList: stores.tokens.getTokenList,
  crossChainTokensInfo: stores.crossChain.crossChainTokensInfo,
  network: stores.session.chainId === 1 ? 'main' : 'testnet',
  updateSettings: newValue => stores.session.updateSettings(newValue),
  updateTokensInfo: (addr, key, val) => stores.tokens.updateTokensInfo(addr, key, val),
  updateCcTokensInfo: (addr, key, val) => stores.tokens.updateCcTokensInfo(addr, key, val),
  deleteCustomToken: token => stores.tokens.deleteCustomToken(token),
}))

@observer
class Config extends Component {
  state = {
    showAddToken: false,
    showConfirm: false,
    showDeleteToken: false,
    tokenToDelete: null,
  }

  handleChange = e => {
    if (e.target.checked === true) {
      this.props.updateSettings({ reinput_pwd: e.target.checked });
    } else { // Confirm pwd when turn off the pwd confirmation.
      this.setState({
        showConfirm: true
      });
    }
  }

  handleStaking = e => {
    this.props.updateSettings({ staking_advance: e.target.checked });
  }

  handleOffline = e => {
    this.props.updateSettings({ offline_wallet: e.target.checked });
  }

  handleSignMessage = e => {
    this.props.updateSettings({ sign_message: e.target.checked });
  }

  handleTimeoutChange = e => {
    this.props.updateSettings({ logout_timeout: e });
  }

  handleAddToken = chain => {
    this.addTokenChain = chain
    this.setState({
      showAddToken: true
    });
  }

  onCancel = () => {
    this.setState({
      showAddToken: false
    });
  }

  handleOk = pwd => {
    if (!pwd) {
      message.warn(intl.get('Config.invalidPassword'));
      return;
    }
    wand.request('phrase_checkPwd', { pwd: pwd }, (err) => {
      if (err) {
        message.warn(intl.get('Config.invalidPassword'));
      } else {
        this.props.updateSettings({ reinput_pwd: false });
        this.setState({
          showConfirm: false
        });
      }
    })
  }

  handleCancel = () => {
    this.setState({
      showConfirm: false
    });
  }

  showDeleteToken = (token) => {
    this.setState({
      showDeleteToken: true,
      tokenToDelete: token,
    })
  }

  hideDeleteToken = () => {
    this.setState({
      showDeleteToken: false,
      tokenToDelete: null,
    })
  }

  deleteToken = () => {
    const addr = this.state.tokenToDelete.addr;
    wand.request('crossChain_deleteCustomToken', { tokenAddr: addr }, err => {
      if (err) {
        console.log('stores_deleteCustomToken', err);
        message.warn(intl.get('Config.deleteTokenAddrErr'));
      } else {
        this.props.deleteCustomToken(addr);
        message.success(intl.get('TransHistory.success'))
      }
    });
    this.hideDeleteToken();
  }

  deleteCrossChainToken = (token) => {
    console.log('deleteCrossChainToken:', token);
  }

  render() {
    const { getTokenList, crossChainTokensInfo } = this.props;
    const { reinput_pwd, staking_advance, logout_timeout, offline_wallet, sign_message } = this.props.settings;

    const options = [{
      value: '0',
      text: intl.get('Config.disableTimeout'),
    }, {
      value: '5',
      text: intl.get('Config.fiveMinutes'),
    }, {
      value: '10',
      text: intl.get('Config.tenMinutes'),
    }, {
      value: '15',
      text: intl.get('Config.fifteenMinutes'),
    }, {
      value: '30',
      text: intl.get('Config.thirtyMinutes'),
    }, {
      value: '60',
      text: intl.get('Config.oneHour'),
    }, {
      value: '120',
      text: intl.get('Config.twoHours'),
    }];

    return (
      <div className={style['settings_config']}>
        <Card title={intl.get('Config.option')}>
          <p className={style['set_title']}>{intl.get('Config.pwdConfirm')}</p>
          <Checkbox checked={reinput_pwd} onChange={this.handleChange}>{intl.get('Config.inputPwd')}</Checkbox>
          <PwdConfirmForm showConfirm={this.state.showConfirm} handleOk={this.handleOk} handleCancel={this.handleCancel}></PwdConfirmForm>
          <div className={style.timeout}>
            <p className={style['set_title']}>{intl.get('Config.loginTimeout')}</p>
            <Select className={style.timeoutSelect} value={logout_timeout === undefined ? defaultTimeout : logout_timeout} placeholder={intl.get('Config.selectLoginTimeout')} onChange={this.handleTimeoutChange}>
              {options.map(item => <Option key={item.value} value={item.value}>{item.text}</Option>)}
            </Select>
          </div>
        </Card>

        <Card title={intl.get('Config.wallet')}>
          <div className={style.set_title}>
            <p className={style['set_title']}>{intl.get('Config.enableWrc20')}</p>
            {
              getTokenList.map((item, index) => {
                if (item.chain === 'WAN') {
                  return <div className={style.tokenStyle} key={index} style={{ display: 'inline-block' }}>
                    <Checkbox key={index} checked={item.select} onChange={() => this.props.updateTokensInfo(item.addr, 'select', !item.select)}>{item.symbol}</Checkbox>
                    <Icon type="close-circle" theme="filled" className={style.deleteIcon} onClick={() => this.showDeleteToken(item)} />
                  </div>
                }
              })
            }
            <div className={style['add_token']} onClick={() => this.handleAddToken('WAN')}>
              <div className={style['account_pattern']}> + </div>
            </div>
          </div>
          <div className={style.sub_title}>
            <p className={style['set_title']}>{intl.get('Config.enableErc20')}</p>
            {
              getTokenList.map((item, index) => {
                if (item.chain === 'ETH') {
                  return <div key={index} style={{ display: 'inline-block' }}>
                    <Checkbox checked={item.select} onChange={() => this.props.updateTokensInfo(item.addr, 'select', !item.select)}>{item.symbol}</Checkbox>
                    <Icon type="close-circle" theme="filled" className={style.deleteIcon} onClick={() => this.showDeleteToken(item)} />
                  </div>
                }
              })
            }
            <div className={style['add_token']} onClick={() => this.handleAddToken('ETH')}>
              <div className={style['account_pattern']}> + </div>
            </div>
          </div>
        </Card>

        <Card title={intl.get('Config.crossChain')}>
          <p className={style['set_title']}>{intl.get('Config.enableErc20')}</p>
          {
            crossChainTokensInfo.map((item, index) => {
              if (item.chain === 'ETH') {
                return <Checkbox key={index} checked={item.select} onChange={() => this.props.updateCcTokensInfo(item.addr, 'select', !item.select)}>{item.symbol}</Checkbox>
              }
            })
          }
          {/* TODO
            <div className={style.sub_title}>
              <p className={style['set_title']}>{intl.get('Config.enableEosToken')}</p>
              {
                crossChainTokensInfo.map((item, index) => {
                  if (item.chain === 'EOS' && item.symbol !== 'EOS') {
                    return <Checkbox key={index} checked={item.select} onChange={() => this.props.updateCcTokensInfo(item.addr, 'select', !item.select)}>{item.symbol}</Checkbox>
                  }
                })
              }
            </div>
          */}
        </Card>
        <Card title={intl.get('Config.staking')}>
          <p className={style['set_title']}>{intl.get('Config.enableValidator')}</p>
          <Checkbox checked={staking_advance} onChange={this.handleStaking}>{intl.get('Config.stakingAdvance')}</Checkbox>
        </Card>
        <Card title={intl.get('Config.others')}>
          <p className={style['set_title']}>{intl.get('Config.enableOfflineWallet')}</p>
          <Checkbox className={style['checkbox_sty']} checked={offline_wallet} onChange={this.handleOffline}>{intl.get('Config.offlineWallet')}</Checkbox>
          <p className={style['set_title']}>{intl.get('SignMessage.enableSider')}</p>
          <Checkbox checked={sign_message} onChange={this.handleSignMessage}>{intl.get('SignMessage.showSign')}</Checkbox>
        </Card>
        {
          this.state.showAddToken && <AddToken chain={this.addTokenChain} onCancel={this.onCancel} />
        }
        {
          this.state.showDeleteToken && <ConfirmDeleteToken token={this.state.tokenToDelete} onOk={this.deleteToken} onClose={this.hideDeleteToken} />
        }
      </div>
    );
  }
}

export default Config;
