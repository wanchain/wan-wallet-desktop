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
import AddDApp from 'containers/AddDApp';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  chainId: stores.session.chainId,
  settings: stores.session.settings,
  tokensOnSideBar: stores.tokens.tokensOnSideBar,
  sidebarColumns: stores.languageIntl.sidebarColumns,
  crossChainOnSideBar: stores.crossChain.crossChainOnSideBar,
  dAppsOnSideBar: stores.dapps.dAppsOnSideBar,
}))

@observer
class Sidebar extends Component {
  state = {
    collapsed: false,
    showAddDapp: false
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

  onAddDapp = () => {
    this.setState({
      showAddDapp: true
    })
  }

  onAddDappClose = () => {
    this.setState({
      showAddDapp: false
    })
  }

  renderMenu = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <SubMenu key={item.key} title={<span><Icon type={item.icon} /><span>{item.title}</span></span>} className={item.step === '1' ? 'ant-menu-top-item' : ''}>
            {this.renderMenu(item.children)}
          </SubMenu>
        );
      }
      return (
        item.key === '/AddDApp' ? (
          <Item key={item.key} onClick={this.onAddDapp}>
            <Icon type="plus-circle" className={style.addIcon} />
          </Item>
       ) : (
          <Item key={item.key} className={item.step === '1' ? 'ant-menu-top-item' : ''}>
            <Link to={item.key}>
              {item.step === '1' ? <Icon type={item.icon} /> : <em className={style['com-circle']}></em>}
              <span>{item.title}</span>
            </Link>
          </Item>
        )
      )
    });
  }

  render() {
    const { sidebarColumns, settings, tokensOnSideBar, crossChainOnSideBar, dAppsOnSideBar } = this.props;
    let stakeIndex = sidebarColumns.findIndex(item => item.key === '/staking');
    let dAppsIndex = sidebarColumns.findIndex(item => item.key === '/thirdPartyDapps');
    let offlineIndex = sidebarColumns.findIndex(item => item.key === '/offline');

    let stakeChildren = sidebarColumns[stakeIndex].children;
    let dAppsChildren = sidebarColumns[dAppsIndex].children;
    let walletIndex = sidebarColumns.findIndex(item => item.key === '/wallet');
    let walletChildren = sidebarColumns[walletIndex].children;
    let crossChainIndex = sidebarColumns.findIndex(item => item.key === '/crossChain');
    let crossChainChildren = sidebarColumns[crossChainIndex].children;
    let crossChainLen = CROSSCHAINTYPE.length;
    let walletChainLen = WALLET_CHAIN.length;

    if (offlineIndex === -1 && settings.offline_wallet) {
      sidebarColumns.push({
        title: intl.get('menuConfig.offline'),
        step: '1',
        key: '/offline',
        icon: 'bank'
      })
    } else if (offlineIndex !== -1 && !settings.offline_wallet) {
      sidebarColumns.splice(offlineIndex, 1);
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

    if (dAppsOnSideBar.length) {
      dAppsChildren.splice(0, dAppsChildren.length - 1, ...dAppsOnSideBar.map(item => {
        let trimUrl = item.url.split('://')[1];
        return ({
          title: item.name,
          key: `/dapp/${trimUrl}`,
          icon: item.icon ? item.icon : 'block'
        })
      }));
    } else {
      dAppsChildren.splice(0, dAppsChildren.length - 1);
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
        {
          this.state.showAddDapp && <AddDApp onClose={this.onAddDappClose} />
        }
      </div>
    );
  }
}

export default Sidebar;
