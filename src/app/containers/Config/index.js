import React, { Component } from 'react';
import { Checkbox, Card, message } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
class Config extends Component {

  handleChange = () => {
  }

  render() {
    return (
      <div>
        <Card title={intl.get('Config.option')}>
          <Checkbox onChange={this.handleChange}>{intl.get('Config.inputPwd')}</Checkbox>
        </Card>
      </div>
    );
  }
}

export default Config;




