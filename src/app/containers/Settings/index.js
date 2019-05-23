import { Tabs } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import Backup from 'containers/Backup';
import Restore from 'containers/Restore';

const { TabPane } = Tabs;

@inject(stores => ({
  language: stores.languageIntl.language,
  settingsColumns: stores.languageIntl.settingsColumns,
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Settings extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle(intl.get('Settings.settings'));
  }

  tabsMap = {
    backup: <Backup />,
    restore: <Restore />,
  }

  renderTab = data => data.map(item => <TabPane tab={item.title} key={item.key}>{item.content}</TabPane>);

  render() {
    const { settingsColumns } = this.props;
    const tabs = [...settingsColumns]
    tabs.forEach(item => item.content = this.tabsMap[item.key] );

    return (
      <Tabs>
        { this.renderTab(tabs) }
      </Tabs>
    );
  }
}

export default Settings;


