import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';

import menuList from 'constants/menuConfig';
import logo from 'static/image/logo.png';
import './index.less';

const SubMenu = Menu.SubMenu;

class Sidebar extends Component {
  componentWillMount() {
    const menuTreeNode = this.renderMenu(menuList);

    this.setState({
      menuTreeNode
    });
  }

  renderMenu = (data) => {
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
            <Icon type={item.icon} />
            {item.title}
          </Link>
        </Menu.Item>
      )
    });
  }

  render () {
    return (
      <div>
        <div className="logo">
          <img src={logo} alt="" />
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['/portfolio']}>
          { this.state.menuTreeNode }
        </Menu>
      </div>
    );
  }
}

export default Sidebar;