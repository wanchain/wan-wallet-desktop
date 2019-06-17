import React, { Component } from 'react';
import { Checkbox, Card, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

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

  render() {
    const { reinput_pwd, staking_advance } = this.props.settings
    return (
      <div>
        <Card title={intl.get('Config.option')}>
          <Checkbox checked={reinput_pwd} onChange={this.handleChange}>{intl.get('Config.inputPwd')}</Checkbox>
        </Card>
        {/* TODO */}
        {/* <Card title={intl.get('Config.staking')}>
          <Checkbox checked={staking_advance} onChange={this.handleStaking}>{intl.get('Config.stakingAdvance')}</Checkbox>
        </Card> */}
      </div>
    );
  }
}

export default Config;




