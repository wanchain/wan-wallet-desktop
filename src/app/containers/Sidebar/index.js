import React, { Component } from 'react';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import style from './index.less';
import logo from 'static/image/logo.png';
import open from 'static/image/navbar-open.png';
import collapse from 'static/image/navbar-collapse.png';
import { CROSSCHAINTYPE, WALLET_CHAIN } from 'utils/settings';

const { SubMenu, Item } = Menu;

@inject(stores => ({
  chainId: stores.session.chainId,
  settings: stores.session.settings,
  tokensOnSideBar: stores.tokens.tokensOnSideBar,
  getWalletTokenList: stores.tokens.getWalletTokenList,
  sidebarColumns: stores.languageIntl.sidebarColumns,
  crossChainOnSideBar: stores.crossChain.crossChainOnSideBar,
  // twoWayBridgeOnSideBar: stores.crossChain.twoWayBridgeOnSideBar,
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
    const { sidebarColumns, settings, tokensOnSideBar, crossChainOnSideBar, dAppsOnSideBar, getWalletTokenList } = this.props;
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

    /* if (tokensOnSideBar.length) {
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
    } */

    /* if (tokensOnSideBar.length) {
      walletChildren.splice(
        walletChainLen,
        walletChildren.length - walletChainLen,
        ...tokensOnSideBar.map(item => ({
          title: item.symbol,
          key: `/tokens/${item.symbol}`,
          icon: 'block',
          mode: 'vertical',
          children: [{
            title: 'ETHEREUM',
            key: `/tokens/${item.chain}/${item.tokenAddr}/${item.symbol}/eth`,
            noCircle: true,
          }, {
            title: 'WANCHAIN',
            key: `/tokens/${item.chain}/${item.tokenAddr}/${item.symbol}/wan`,
            noCircle: true,
          }]
        })),
      );
    } else {
      walletChildren.splice(walletChainLen, walletChildren.length - walletChainLen);
    } */

    // console.log('tokensOnSideBar:', tokensOnSideBar);

    // console.log('getWalletTokenList:::::::::::::', getWalletTokenList);
    let walletList = [];
    getWalletTokenList.forEach(v => {
      if (v.children.length === 0) {
        return false;
      }
      if (v.children.find(c => c.selected === true)) {
        let children = [];
        v.children.forEach(c => {
          if (c.selected === true) {
            children.push({
              title: c.title,
              key: c.key,
              noCircle: true,
            });
          }
        });
        walletList.push({
          title: v.chain,
          key: v.key,
          icon: 'block',
          mode: 'vertical',
          children: children
        });
      }
    });
    // console.log('--------walletList---------', walletList);
    walletChildren.splice(0, walletChildren.length, ...walletList);
    // walletChildren.splice(walletChildren.length, 0, {
    /* walletChildren.splice(0, walletChildren.length, {
      title: 'WAN',
      key: `Account_${'WAN'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@Wanchain',
        key: `/${'wan'}Account/${'WAN'}/Wanchain`,
        noCircle: true,
      }, {
        title: '@Ethereum',
        key: `/${'eth'}Account/${'WAN'}/Ethereum`,
        noCircle: true,
      }]
    }, {
      title: 'ETH',
      key: `Account_${'ETH'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@Ethereum',
        key: `/${'eth'}Account/${'ETH'}/Ethereum`,
        noCircle: true,
      }, {
        title: '@Wanchain',
        key: `/${'eth'}Account/${'ETH'}/Wanchain`,
        noCircle: true,
      }]
    }, {
      title: 'BTC',
      key: `Account_${'BTC'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@Bitcoin',
        key: `/${'btc'}Account/${'BTC'}/Bitcoin`,
        noCircle: true,
      }, {
        title: '@Wanchain',
        key: `/tokens/WAN/0x89a3e1494bc3db81dadc893ded7476d33d47dcbd/WBTC`,
        noCircle: true,
      }, {
        title: '@Ethereum',
        key: `/${'eth'}Account/${'BTC'}/Ethereum`,
        noCircle: true,
      }]
    }, {
      title: 'EOS',
      key: `Account_${'EOS'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@EOS',
        key: `/${'eos'}Account/${'EOS'}/EOS`,
        noCircle: true,
      }]
    }, {
      title: 'MKR',
      key: `Account_${'MKR'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@Wanchain',
        key: `/${'eth'}Account/${'MKR'}/Wanchain`,
        noCircle: true,
      }, {
        title: '@Ethereum',
        key: `/${'eth'}Account/${'MKR'}/Ethereum`,
        noCircle: true,
      }]
    }, {
      title: 'USDT',
      key: `Account_${'USDT'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: '@Wanchain',
        key: `/tokens/WAN/0x56948c162aaa6cce3f196b93903318502989f573/WUSDT`,
        noCircle: true,
      }, {
        title: '@Ethereum',
        key: `/tokens/ETH/0x28c96b26f6df3cf57a0a4e8fef02e9295e9ca458/USDT`,
        noCircle: true,
      }]
    }); */

    // Add token.
    walletChildren.push({
      title: intl.get('Sidebar.moreTokens'),
      key: `/MoreAccount`,
      icon: 'block'
    });

    /* if (crossChainOnSideBar.length) {
      crossChainChildren.splice(crossChainLen, crossChainChildren.length - crossChainLen, ...crossChainOnSideBar.map(item => {
        return ({
          title: item.symbol,
          key: `/crossChain/${item.chain}/${item.chain !== 'EOS' ? item.tokenAddr : item.tokenOrigAddr}/${item.symbol}`,
          icon: 'block'
        })
      }));
    } else {
      crossChainChildren.splice(crossChainLen, crossChainChildren.length - crossChainLen);
    } */
    /* if (twoWayBridgeOnSideBar.length) {
      crossChainChildren.splice(crossChainChildren.length, 0, ...twoWayBridgeOnSideBar.map(item => ({
        title: item.symbol,
        key: `/crosschain/${item.key}/${item.first_address ? item.first_address : ''}-${item.second_address ? item.second_address : ''}`,
        icon: 'block'
      })));
    } */

    crossChainChildren.splice(0, crossChainChildren.length);
    crossChainChildren.splice(crossChainChildren.length, 0, {
      title: 'BTC',
      key: `${'CrossChain_BTC'}`,
      icon: 'block',
      mode: 'vertical',
      children: [{
        title: 'Bitcoin <-> Wanchain',
        // key: `/crosschain/Bitcoin-Wanchain/BTC-wanBTC/-0x89a3e1494bc3db81dadc893ded7476d33d47dcbd`,
        key: `/crossBTC`,
        noCircle: true,
      }, {
        title: 'Bitcoin <-> Ethereum',
        key: `/crosschain/Bitcoin-Ethereum/BTC-wanBTC/-0x89a3e1494bc3db81dadc893ded7476d33d47dcbd`,
        noCircle: true,
      }, {
        title: 'Ethereum <-> Wanchain',
        key: `/crosschain/Ethereum-Wanchain/wanBTC-wanBTC/-0x89a3e1494bc3db81dadc893ded7476d33d47dcbd`,
        noCircle: true,
      }]
    });

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
