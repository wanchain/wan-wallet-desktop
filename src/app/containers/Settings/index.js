import React, { Component } from 'react';
import { Tabs } from 'antd';
import Backup from 'containers/Backup';

const { TabPane } = Tabs;

class Settings extends Component {

  tabs = [{
    title: 'Backup',
    key: 'backup',
    content: <Backup />
  }, {
    title: 'Restore',
    key: 'restore',
    content: 'Restore phrase'
  }];

  componentWillMount() {
    const tabTreeNode = this.renderTab(this.tabs);

    this.setState({
      tabTreeNode
    });
  }

  renderTab = (data) => {
    return data.map(item => <TabPane tab={item.title} key={item.key}>{item.content}</TabPane>);
  }

  render() {
    return (
      <Tabs>
        { this.state.tabTreeNode }
      </Tabs>
    );
  }
}

export default Settings;


