import React, { Component } from 'react';
import { Checkbox, Card, Select, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
const {Option} = Select;
@inject(stores => ({
  settings: stores.session.settings,
  language: stores.languageIntl.language,
  updateSettings: newValue => stores.session.updateSettings(newValue),
}))

@observer
class Config extends Component {
  handleChange = e => {
    this.props.updateSettings({reinput_pwd: e.target.checked})
  }

  handleStaking = e => {
    this.props.updateSettings({staking_advance: e.target.checked})
  }

  handleTimeoutChange = e => {
    this.props.updateSettings({logout_timeout: e})
  }

  render() {
    const { reinput_pwd, staking_advance, logout_timeout } = this.props.settings;
    const defaultTimeout = "5";
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
      <div>
        <Card title={intl.get('Config.option')}>
          <p className="set_title">{intl.get('Config.pwdConfirm')}</p>
          <Checkbox checked={reinput_pwd} onChange={this.handleChange}>{intl.get('Config.inputPwd')}</Checkbox>
          <div className="timeout">
            <p className="set_title">{intl.get('Config.loginTimeout')}</p>
            <Select className="timeoutSelect" value={logout_timeout === undefined ? defaultTimeout : logout_timeout} defaultValue={defaultTimeout} placeholder={intl.get('Config.selectLoginTimeout')} onChange={this.handleTimeoutChange}>
              {
                options.map((item)=>{
                  return (
                    <Option key={item.value} value={item.value}>{item.text}</Option>
                  )
                })
              }
            </Select>
          </div>
        </Card>
        <Card title={intl.get('Config.staking')}>
          <Checkbox checked={staking_advance} onChange={this.handleStaking}>{intl.get('Config.stakingAdvance')}</Checkbox>
        </Card>
      </div>
    );
  }
}

export default Config;




