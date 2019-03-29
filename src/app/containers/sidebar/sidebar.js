import React, { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';

const { Sider } = Layout;

import logo from 'static/image/logo.png';

class Sidebar extends Component {
  render () {
    return (
      <Layout>
        <Sider>
          <img className="logo" src={logo} />
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              <Icon type="user" />
              <span>Portfolio</span>
            </Menu.Item>
            <Menu.Item key="2">
              <Icon type="video-camera" />
              <span>Wallet</span>
            </Menu.Item>
            <Menu.Item key="3">
              <Icon type="upload" />
              <span>Cross Chain</span>
            </Menu.Item>
            <Menu.Item key="4">
              <Icon type="upload" />
              <span>Hardware Wallet</span>
            </Menu.Item>
            <Menu.Item key="5">
              <Icon type="upload" />
              <span>Settings</span>
            </Menu.Item>
          </Menu>
        </Sider>
      </Layout>
    );
  }
}

export default Sidebar;