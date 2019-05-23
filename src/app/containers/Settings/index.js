import { Tabs } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import Backup from 'containers/Backup';
import Restore from 'containers/Restore';

const { TabPane } = Tabs;

@inject(stores => ({
  language: stores.languageIntl.language,
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Settings extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle(intl.get('Settings.settings'));
    this.state = {
      tabTreeNode: null
    }
  }

  tabs = [{
    title: intl.get('Settings.backup'),
    key: 'backup',
    content: <Backup />
  }, {
    title: intl.get('Settings.restore'),
    key: 'restore',
    content: <Restore />
  }]

  componentDidMount() {
    const tabTreeNode = this.renderTab(this.tabs);
    this.setState({
      tabTreeNode
    });
  }

  renderTab = data => data.map(item => <TabPane tab={item.title} key={item.key}>{item.content}</TabPane>);

  render() {
    return (
      <Tabs>
        { this.state.tabTreeNode }
      </Tabs>
    );
  }
}

export default Settings;


