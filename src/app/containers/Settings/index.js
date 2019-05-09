import { Tabs } from 'antd';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Backup from 'containers/Backup';

const { TabPane } = Tabs;

@inject(stores => ({
  changeTitle: newTitle => stores.session.changeTitle(newTitle)
}))

@observer
class Settings extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Settings');
    this.state = {
      tabTreeNode: null
    }
  }

  tabs = [{
    title: 'Backup',
    key: 'backup',
    content: <Backup />
  }, {
    title: 'Restore',
    key: 'restore',
    content: 'Restore phrase'
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


