import { Tabs } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Backup from 'containers/Backup';
import Restore from 'containers/Restore';
import Config from 'containers/Config';
import Network from 'containers/Network';
import ImportPrivateKey from 'containers/ImportPrivateKey';
import DAppManage from 'containers/DAppManage';
import Contacts from 'containers/Contacts';
import style from './index.less';

const { TabPane } = Tabs;

@inject(stores => ({
  settingsColumns: stores.languageIntl.settingsColumns,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle)
}))

@observer
class Settings extends Component {
  componentDidMount () {
    this.props.changeTitle('Settings.settings');
  }

  tabsMap = {
    config: <Config />,
    backup: <Backup />,
    restore: <Restore />,
    network: <Network />,
    importPrivateKey: <ImportPrivateKey />,
    application: <DAppManage />,
    addressBook: <Contacts />,
  }

  renderTab = data => data.map(item => <TabPane tab={item.title} key={item.key}>{item.content}</TabPane>);

  render () {
    const { settingsColumns } = this.props;
    const tabs = [...settingsColumns]
    tabs.forEach(item => { item.content = this.tabsMap[item.key] });

    return (
      <Tabs className={style.settings}>
        { this.renderTab(tabs) }
      </Tabs>
    );
  }
}

export default Settings;
