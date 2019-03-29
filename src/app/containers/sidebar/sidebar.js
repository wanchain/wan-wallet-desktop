import React, { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';

const { Sider } = Layout;

import logo from 'static/image/logo.png';
import './sidebar.css';

class Sidebar extends Component {
  render () {
    return (
      <Layout style={{minHeight:"100vh"}}>
        <Sider width="100%">
          <img className="logo" src={logo} />
          <Menu theme="dark" mode="vertical" defaultSelectedKeys={['user']} style={{minHeight:"60vh"}}>
            <Menu.Item key="user">
              <Icon type="user" />
              <span>Portfolio</span>
            </Menu.Item>
            <Menu.Item key="Wallet">
              <Icon type="video-camera" />
              <span>Wallet</span>
            </Menu.Item>
            <Menu.Item key="Cross Chain">
              <Icon type="upload" />
              <span>Cross Chain</span>
            </Menu.Item>
            <Menu.Item key="Hardware Wallet">
              <Icon type="upload" />
              <span>Hardware Wallet</span>
            </Menu.Item>
            <Menu.Item key="Settings">
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