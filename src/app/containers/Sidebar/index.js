import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';
import logo from 'static/image/logo.png';
import open from 'static/image/navbar-open.png';
import collapse from 'static/image/navbar-collapse.png';
import { CROSSCHAINTYPE, COIN_ACCOUNT, COIN_ACCOUNT_EOS } from 'utils/settings';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  chainId: stores.session.chainId,
  settings: stores.session.settings,
  getWalletSelections: stores.tokens.getWalletSelections,
  sidebarColumns: stores.languageIntl.sidebarColumns,
  crossChainSelections: stores.crossChain.crossChainSelections,
  dAppsOnSideBar: stores.dapps.dAppsOnSideBar,
  setCoin: () => stores.portfolio.setCoin(),
  updateCoinPrice: () => stores.portfolio.updateCoinPrice(),
}))

@observer
class Sidebar extends Component {
  state = {
    collapsed: false,
  }

  componentDidMount() {
    this.props.setCoin();
    this.props.updateCoinPrice();
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
              title: `@${intl.get(`Common.${c.title.toLowerCase()}`)}`,
              key: c.key,
              noCircle: true,
              isOriginal: c.isOriginalChain,
            });
          }
        });
        walletList.push({
          title: v.symbol,
          key: v.key,
          icon: 'block',
          mode: 'vertical',
          children: children.sort((obj1, obj2) => obj1.isOriginal < obj2.isOriginal ? 1 : -1)
        });
      }
    });
    walletChildren.splice(0, walletChildren.length, ...walletList);

    // Add token.
    walletChildren.push({
      title: intl.get('Sidebar.moreTokens'),
      key: `/MoreAccount`,
      icon: 'block'
    });

    // Cross chain menu
    let crossChainList = [];
    Object.keys(crossChainSelections).forEach(symbol => {
      if (crossChainSelections[symbol].every(v => v.selected === false)) {
        return;
      }
      let arr = [];
      crossChainSelections[symbol].forEach(v => {
        if (v.selected) {
          let key = '';
          if ((v.fromAccount === COIN_ACCOUNT || v.fromAccount === COIN_ACCOUNT_EOS) && CROSSCHAINTYPE.includes(v.ancestorSymbol)) {
            key = `/cross${v.ancestorSymbol}/${v.id}`;
          } else {
            key = `/crossChain/${v.id}`;
          }
          arr.push({
            title: `${intl.get(`Common.${v.fromChainName.toLowerCase()}`)} <-> ${intl.get(`Common.${v.toChainName.toLowerCase()}`)}`,
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
      title: intl.get('Sidebar.moreTokens'),
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
