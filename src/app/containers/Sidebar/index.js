import React, { Component } from 'react';
import { Layout, Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';

const { Sider } = Layout;

import logo from 'static/image/logo.png';
import './index.css';

class Sidebar extends Component {
  render () {
    return (
      <Layout style={{minHeight:"100vh"}}>
        <Sider width="100%">
          <img className="logo" src={logo} />
          <Menu theme="dark" mode="vertical" defaultSelectedKeys={['Portfolio']} style={{minHeight:"60vh"}}>
            <Menu.Item key="Portfolio">
              <Link to="/">
                <Icon type="user" />
                <span>
                  Portfolio            
                </span>
              </Link>
            </Menu.Item>
            <Menu.Item key="Wallet">
              <Link to="/wallet">
                <Icon type="video-camera" />
                <span>
                  Wallet            
                </span>
              </Link>
            </Menu.Item>
            <Menu.Item key="Cross Chain">
              <Link to="/crossChain">
                <Icon type="upload" />
                <span>
                  Cross Chain
                </span>  
              </Link>
            </Menu.Item>
            <Menu.Item key="Hardware Wallet">
              <Link to="/hardwareWallet">
                <Icon type="upload" />
                <span>
                  Hardware Wallet
                </span>
              </Link>
            </Menu.Item>
            <Menu.Item key="Settings">
              <Link to="/settings">
                <Icon type="upload" />
                <span>
                  Settings
                </span>
              </Link>
            </Menu.Item>
          </Menu>
        </Sider>
      </Layout>
    );
  }
}

export default Sidebar;