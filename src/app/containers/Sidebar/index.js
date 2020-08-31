import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';
import logo from 'static/image/logo.png';
import open from 'static/image/navbar-open.png';
import collapse from 'static/image/navbar-collapse.png';
import { CROSSCHAINTYPE, WALLET_CHAIN, COIN_ACCOUNT } from 'utils/settings';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  chainId: stores.session.chainId,
  settings: stores.session.settings,
  getWalletSelections: stores.tokens.getWalletSelections,
  sidebarColumns: stores.languageIntl.sidebarColumns,
  crossChainSelections: stores.crossChain.crossChainSelections,
  dAppsOnSideBar: stores.dapps.dAppsOnSideBar,
}))

@observer
class Sidebar extends Component {
  state = {
    collapsed: false,
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
        if (item.mode) {
          return (
            <SubMenu className={'sideBarSubMenu'} key={item.key} title={<span><em className={style['com-circle']}></em><span>{item.title}</span></span>}>
              {this.renderMenu(item.children)}
            </SubMenu>
          );
        } else {
          return (
            <SubMenu className={'sideBarSubMenu'} key={item.key} title={<span><Icon type={item.icon} /><span>{item.title}</span></span>} className={item.step === '1' ? 'ant-menu-top-item' : 'sideBarSubMenuItem'}>
              {this.renderMenu(item.children)}
            </SubMenu>
          );
        }
      }
      return (
        <Item key={item.key} className={item.step === '1' ? 'ant-menu-top-item' : 'sideBarSubMenuItem'}>
          <Link to={item.key}>
            {item.step === '1' ? <Icon type={item.icon} /> : !item.noCircle && <em className={style['com-circle']}></em>}
            <span>{item.title}</span>
          </Link>
        </Item>
      )
    });
  }

  onOpenChange = (openKeys) => {
    this.props.toggleMask(openKeys.length !== 0);
  }

  render() {
    const { sidebarColumns, settings, crossChainSelections, dAppsOnSideBar, getWalletSelections } = this.props;
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

    // Wallet menu
    let walletList = [];
    getWalletSelections.forEach(v => {
      if (v.children.length === 0) {
        return false;
      }
      if (v.children.some(c => c.selected === true)) {
        let children = [];
        v.children.forEach(c => {
          if (c.selected === true) {
            children.push({
              title: `@ ${c.title}`,
              key: c.key,
              noCircle: true,
            });
          }
        });
        walletList.push({
          title: v.symbol,
          key: v.key,
          icon: 'block',
          mode: 'vertical',
          children: children
        });
      }
    });
    walletChildren.splice(0, walletChildren.length, ...walletList);
    // console.log('walletList=======:', walletList);

    // Add token.
    walletChildren.push({
      title: intl.get('Sidebar.moreTokens'),
      key: `/MoreAccount`,
      icon: 'block'
    });

    // Cross chain menu
    let crossChainList = [{
      title: 'BTC',
      key: 'BTC',
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: `Bitcoin <-> Wanchain`,
        key: `/crossBTC`,
        noCircle: true,
      }],
    }, {
      title: 'EOS',
      key: 'EOS',
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: `EOS <-> Wanchain`,
        key: `/crossEOS`,
        noCircle: true,
      }],
    }];

    Object.keys(crossChainSelections).forEach(symbol => {
      if (crossChainSelections[symbol].every(v => v.selected === false)) {
        return;
      }
      let arr = [];
      crossChainSelections[symbol].forEach(v => {
        if (v.selected) {
          let key = '';
          if (v.fromAccount === COIN_ACCOUNT && CROSSCHAINTYPE.includes(v.ancestorSymbol)) {
            key = `/cross${v.ancestorSymbol}/${v.id}`;
          } else {
            key = `/crosschain/${v.id}`;
          }
          arr.push({
            title: `${v.fromChainName} <-> ${v.toChainName}`,
            key,
            noCircle: true,
          });
        }
      });
      let index = crossChainList.findIndex(item => item.key === symbol);
      if (index !== -1) {
        crossChainList[index].children = crossChainList[index].children.concat(arr);
      } else {
        crossChainList.push({
          title: symbol,
          key: symbol,
          icon: 'block',
          mode: 'vertical',
          children: arr,
        });
      }
    });
    crossChainChildren.splice(0, crossChainChildren.length, ...crossChainList);

    // Add cross chain.
    crossChainChildren.push({
      title: intl.get('MoreCrossChain.more'),
      key: `/moreCrossChain`,
      icon: 'block'
    });

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
          <Menu theme="dark" mode="vertical" /* subMenuCloseDelay={0.05} */ onOpenChange={this.onOpenChange} selectable={true} defaultSelectedKeys={[this.props.path]} className={style.menuTreeNode}>
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
