import React, { Component } from 'react';
import { Menu, Icon, message } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';
import OneStep from 'utils/OneStep';
import logo from 'static/image/logo.png';
import open from 'static/image/navbar-open.png';
import collapse from 'static/image/navbar-collapse.png';
import { getAllUndoneCrossTrans } from 'utils/helper';
import { CROSSCHAINTYPE, WALLET_CHAIN } from 'utils/settings';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  chainId: stores.session.chainId,
  settings: stores.session.settings,
  netStatus: stores.session.netStatus,
  tokensOnSideBar: stores.tokens.tokensOnSideBar,
  onlineSidebarColumns: stores.languageIntl.sidebarColumns,
  crossChainOnSideBar: stores.crossChain.crossChainOnSideBar,
  offlineSidebarColumns: stores.languageIntl.offlineSidebarColumns,
}))

@observer
class Sidebar extends Component {
  state = {
    collapsed: false
  }

  // componentDidMount() {
  //   this.timer = setInterval(() => {
  //     // Handle one step cross chain and undo cross chain trans
  //     getAllUndoneCrossTrans((err, ret) => {
  //       if (!err) {
  //         OneStep.initUndoTrans(ret).handleRedeem().handleRevoke();
  //       } else {
  //         message.warn(intl.get('network.down'));
  //       }
  //     })
  //   }, 10000);
  // }

  // componentWillUnmount() {
  //   clearInterval(this.timer);
  // }

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
            {item.step === '1' ? <Icon type={item.icon} /> : <em className={style['com-circle']}></em>}
            <span>{item.title}</span>
          </Link>
        </Item>
      )
    });
  }

  render() {
    const { settings, tokensOnSideBar, crossChainOnSideBar, offlineSidebarColumns, onlineSidebarColumns, netStatus } = this.props;

    let sidebarColumns = netStatus ? onlineSidebarColumns : offlineSidebarColumns;
    if (netStatus) {
      let stakeIndex = sidebarColumns.findIndex(item => item.key === '/staking');
      let stakeChildren = sidebarColumns[stakeIndex].children;
      let walletIndex = sidebarColumns.findIndex(item => item.key === '/wallet');
      let walletChildren = sidebarColumns[walletIndex].children;
      let crossChainIndex = sidebarColumns.findIndex(item => item.key === '/crossChain');
      let crossChainChildren = sidebarColumns[crossChainIndex].children;
      let crossChainLen = CROSSCHAINTYPE.length;
      let walletChainLen = WALLET_CHAIN.length;

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

      if (tokensOnSideBar.length) {
        walletChildren.splice(
          walletChainLen,
          walletChildren.length - walletChainLen,
          ...tokensOnSideBar.map(item => ({
            title: item.symbol,
            key: `/tokens/${item.chain}/${item.tokenAddr}/${item.symbol}`,
            icon: 'block'
          })),
        );
      } else {
        walletChildren.splice(walletChainLen, walletChildren.length - walletChainLen);
      }

      if (crossChainOnSideBar.length) {
        crossChainChildren.splice(crossChainLen, crossChainChildren.length - crossChainLen, ...crossChainOnSideBar.map(item => {
          return ({
            title: item.symbol,
            key: `/crossChain/${item.chain}/${item.chain !== 'EOS' ? item.tokenAddr : item.tokenOrigAddr}/${item.symbol}`,
            icon: 'block'
          })
        }));
      } else {
        crossChainChildren.splice(crossChainLen, crossChainChildren.length - crossChainLen);
      }
    }

    return (
      <div>
        <div className={style.sidebar + ' sidebar'}>
          <div className={style.logo}>
            <img className={style.expandedLogo} src={logo} alt={intl.get('Sidebar.wanchain')} />
          </div>
          <Menu theme="dark" mode="inline" /* inlineCollapsed={this.state.collapsed} */ defaultSelectedKeys={[this.props.path]} className={style.menuTreeNode}>
            {this.renderMenu(sidebarColumns)}
          </Menu>
        </div>
        <div className={style.collapseItem + ' collapseItem'}>
          <img src={this.state.collapsed ? open : collapse} className={style.collapseButton} onClick={this.toggleMenu} />
        </div>
      </div>
    );
  }
}

export default Sidebar;
