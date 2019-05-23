import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import logo from 'static/image/logo.png';

const SubMenu = Menu.SubMenu;

@inject(stores => ({
  language: stores.languageIntl.language,
  sidebarColums: stores.languageIntl.sidebarColums,
}))

@observer
class Sidebar extends Component {

  renderMenu = data => {
    return data.map((item) => {
      if(item.children) {
        return (
          <SubMenu key={item.key} title={<span><Icon type={item.icon} /><span>{item.title}</span></span>}>
            { this.renderMenu(item.children) }
          </SubMenu>
        );
      }
      return (
        <Menu.Item key={item.key}>
          <Link to={item.key}>
            {item.step === '1' ? <Icon type={item.icon} /> : <em className="com-circle"></em>}
            {item.title}
          </Link>
        </Menu.Item>
      )
    });
  }

  render() {
    const { sidebarColums } = this.props;

    return (
      <div className="sidebar">
        <div className="logo">
          <img src={logo} alt={intl.get('Sidebar.wanchain')} />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['/']} className="menuTreeNode">
          { this.renderMenu(sidebarColums) }
        </Menu>
      </div>
    );
  }
}

export default Sidebar;