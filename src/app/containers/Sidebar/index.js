import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import logo from 'static/image/logo.png';

const SubMenu = Menu.SubMenu;

@inject(stores => ({
  sidebarColumns: stores.languageIntl.sidebarColumns,
  settings: stores.session.settings,
}))

@observer
class Sidebar extends Component {
  renderMenu = data => {
    return data.map(item => {
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
    const { sidebarColumns, settings } = this.props;
    let stakeIndex = sidebarColumns.findIndex(item => item.key === '/staking');
    let stakChildren = sidebarColumns[stakeIndex].children;

    if(settings.staking_advance) {
      if(stakChildren.findIndex(item => item.key === '/validator') === -1) {
        stakChildren.push({
          title: intl.get('menuConfig.validator'),
          key: '/validator',
          icon: 'block'
        })
      }
    } else {
      if(stakChildren.length > 1) {
        stakChildren.pop();
      }
    }

    return (
      <div className="sidebar">
        <div className="logo">
          <img src={logo} alt={intl.get('Sidebar.wanchain')} />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={[this.props.path]} className="menuTreeNode">
          { this.renderMenu(sidebarColumns) }
        </Menu>
      </div>
    );
  }
}

export default Sidebar;