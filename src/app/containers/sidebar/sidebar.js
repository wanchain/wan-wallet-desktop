import React, { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';

const { Sider } = Layout;

import logo from 'static/image/logo.png';
import './sidebar.css';

class Sidebar extends Component {
  render () {
    return (
      <Layout style={{minHeight:"100vh"}}>
        <Sider width="100%">
          <img className="logo" src={logo} />
          <Menu theme="dark" mode="vertical" defaultSelectedKeys={['Portfolio']} style={{minHeight:"60vh"}}>
            <Menu.Item key="Portfolio">
              <Icon type="user" />
              <span>
                <Link to="/">Portfolio</Link>              
              </span>
            </Menu.Item>
            <Menu.Item key="Wallet">
              <Icon type="video-camera" />
              <span>
                <Link to="/wallet">Wallet</Link>              
              </span>
            </Menu.Item>
            <Menu.Item key="Cross Chain">
              <Icon type="upload" />
              <span>
                <Link to="/crossChain">Cross Chain</Link>
              </span>
            </Menu.Item>
            <Menu.Item key="Hardware Wallet">
              <Icon type="upload" />
              <span>
                <Link to="/hardwareWallet">Hardware Wallet</Link>
              </span>
            </Menu.Item>
            <Menu.Item key="Settings">
              <Icon type="upload" />
              <span>
                <Link to="/settings">Settings</Link>
              </span>
            </Menu.Item>
          </Menu>
        </Sider>
      </Layout>
    );
  }
}

export default Sidebar;