import { Tabs } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Backup from 'containers/Backup';
import Restore from 'containers/Restore';
import Config from 'containers/Config';

const { TabPane } = Tabs;

@inject(stores => ({
  settingsColumns: stores.languageIntl.settingsColumns,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle)
}))

@observer
class Settings extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Settings.settings');
  }

  tabsMap = {
    config: <Config />,
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


