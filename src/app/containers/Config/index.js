import React, { Component } from 'react';
import { Checkbox, Card, Select, Form, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import { defaultTimeout } from 'utils/settings';
import AddToken from 'componentUtils/AddToken';
import PasswordConfirmForm from 'components/PasswordConfirmForm';
const { Option } = Select;
const PwdConfirmForm = Form.create({ name: 'PasswordConfirmForm' })(PasswordConfirmForm);
@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  wrc20TokensInfo: stores.tokens.wrc20TokensInfo,
  crossChainTokensInfo: stores.crossChain.crossChainTokensInfo,
  network: stores.session.chainId === 1 ? 'main' : 'testnet',
  updateSettings: newValue => stores.session.updateSettings(newValue),
  updateTokensInfo: (addr, key, val) => stores.tokens.updateTokensInfo(addr, key, val),
}))

@observer
class Config extends Component {
  state = {
    showAddToken: false,
    showConfirm: false
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

  handleTimeoutChange = e => {
    this.props.updateSettings({ logout_timeout: e });
  }

  handleTokensSelected = val => {
    this.props.updateTokensInfo(val.wanAddr, 'select', !val.select);
  }

  handleCrossChainSelected = val => {
    this.props.updateTokensInfo(val.wanAddr, 'ccSelect', !val.select);
  }

  handleAddToken = () => {
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
    wand.request('phrase_reveal', { pwd: pwd }, (err) => {
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

  render() {
    const { wrc20TokensInfo, crossChainTokensInfo } = this.props;
    const { reinput_pwd, staking_advance, logout_timeout } = this.props.settings;

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
        <Card title={intl.get('Config.staking')}>
          <p className={style['set_title']}>{intl.get('Config.enableValidator')}</p>
          <Checkbox checked={staking_advance} onChange={this.handleStaking}>{intl.get('Config.stakingAdvance')}</Checkbox>
        </Card>
        <Card title={intl.get('Config.crossChain')}>
          <p className={style['set_title']}>{intl.get('Common.erc20')}</p>
          {
            crossChainTokensInfo.map((item, index) => <Checkbox key={index} checked={item.select} onChange={() => this.handleCrossChainSelected(item)}>{item.symbol}</Checkbox>)
          }
        </Card>
        <Card title={intl.get('Config.wrc20')}>
          <p className={style['set_title']}>{intl.get('Config.enableWrc20')}</p>
          {
            wrc20TokensInfo.map((item, index) => <Checkbox key={index} checked={item.select} onChange={() => this.handleTokensSelected(item)}>{item.symbol}</Checkbox>)
          }
          <div className={style['add_token']} onClick={this.handleAddToken}>
            <div className={style['account_pattern']}> + </div>
          </div>
        </Card>
        {
          this.state.showAddToken && <AddToken onCancel={this.onCancel} />
        }
      </div>
    );
  }
}

export default Config;
