import React, { Component } from 'react';
import { Tabs, Icon } from 'antd';
import Backup from 'containers/Backup';

const TabPane = Tabs.TabPane;

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


  render() {
    return (
      <Tabs>
        {
          this.tabs.map(item => {
            return (<TabPane tab={item.title} key={item.key}>{item.content}</TabPane>);
          })
        }
      </Tabs>
    );
  }
}

export default Settings;


