import React, { Component } from 'react';
import { Menu, Icon, Button } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';
import logo from 'static/image/logo.png';
import collapse from 'static/image/navbar-collapse.png';
import open from 'static/image/navbar-open.png';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  sidebarColumns: stores.languageIntl.sidebarColumns,
  chainId: stores.session.chainId,
  settings: stores.session.settings,
}))

@observer
class Sidebar extends Component {
  state = {
    collapsed: false
  }

  toggleMenu = () => {
    this.setState({
      collapsed: !this.state.collapsed
    });
    this.props.handleNav();
  }

  renderMenu = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <SubMenu key={item.key} title={<span><Icon type={item.icon} /><span>{item.title}</span></span>}>
            {this.renderMenu(item.children)}
          </SubMenu>
        );
      }
      return (
        <Item key={item.key}>
          <Link to={item.key}>
            {item.step === '1' ? <Icon type={item.icon} /> : <em className="com-circle"></em>}
            <span>{item.title}</span>
          </Link>
        </Item>
      )
    });
  }

  render() {
    const { sidebarColumns, settings } = this.props;
    let stakeIndex = sidebarColumns.findIndex(item => item.key === '/staking');
    let stakeChildren = sidebarColumns[stakeIndex].children;

    // let index = stakeChildren.findIndex(item => item.key === '/validator');
    // if (index === -1 && settings.staking_advance) {
    //   stakeChildren.push({
    //     title: intl.get('menuConfig.validator'),
    //     key: '/validator',
    //     icon: 'block'
    //   })
    // } else if (index !== -1 && !settings.staking_advance) {
    //   stakeChildren.splice(index, 1);
    // }

    /** TODO */
    if (this.props.chainId === 1) {
      if (stakeIndex !== -1) {
        sidebarColumns.splice(stakeIndex, 1);
      }
    } else {
      if (stakeIndex === -1) {
        sidebarColumns.splice(stakeChildren.findIndex(item => item.key === '/settings'), 0,
          {
            title: intl.get('menuConfig.galaxyPos'),
            step: '1',
            key: '/staking',
            icon: 'pie-chart',
            children: [
              {
                title: intl.get('menuConfig.delegation'),
                key: '/staking',
                icon: 'block'
              }
            ]
          })
      }
      let index = stakeChildren.findIndex(item => item.key === '/validator');
      if (index === -1 && settings.staking_advance) {
        stakeChildren.push({
          title: intl.get('menuConfig.validator'),
          key: '/validator',
          icon: 'block'
        })
      } else if (index !== -1 && !settings.staking_advance) {
        stakeChildren.splice(index, 1);
      }
    }

    return (
      <div>
        <div className="sidebar">
          <div className="logo">
            <img className="expandedLogo" src={logo} alt={intl.get('Sidebar.wanchain')} />
          </div>
          <Menu theme="dark" mode="inline" /* inlineCollapsed={this.state.collapsed} */ defaultSelectedKeys={[this.props.path]} className="menuTreeNode">
            {this.renderMenu(sidebarColumns)}
          </Menu>

        </div>
        <div className="collapseItem">
          <img src={this.state.collapsed ? open : collapse} className="collapseButton" onClick={this.toggleMenu} />
        </div>
      </div>
    );
  }
}

export default Sidebar;