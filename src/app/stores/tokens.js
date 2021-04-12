import BigNumber from 'bignumber.js';
import { observable, action, computed, makeObservable } from 'mobx';
import Identicon from 'identicon.js';
import btcImg from 'static/image/btc.png';
import ethImg from 'static/image/eth.png';
import eosImg from 'static/image/eos.png';
import xrpImg from 'static/image/xrp.png';
import wanImg from 'static/image/wan.png';
import bnbImg from 'static/image/bnb.png';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import xrpAddress from './xrpAddress';
import bnbAddress from './bnbAddress';
import crossChain from './crossChain';
import session from './session';

import { formatNum, formatNumByDecimals } from 'utils/support';
import {
  WANPATH, ETHPATH, BSCPATH, EOSPATH, BTCPATH_MAIN, BTCPATH_TEST, COIN_ACCOUNT, COIN_ACCOUNT_EOS, TOKEN_PRIORITY,
  FNX_POOL_MAINNET, FNX_POOL_TESTNET
} from 'utils/settings';

class Tokens {
  @observable currTokenAddr = '';

  @observable currTokenChain = '';

  @observable tokensList = {}; // Tokens collection

  @observable tokensBalance = {};

  @observable tokenIconList = {};

  @observable walletSelections = {};

  @observable chainBalanceList = [];

  constructor() {
    makeObservable(this);
  }

  @action updateTokenSelectedStatus(tokenAddress, selected) {
    wand.request('crossChain_updateTokensInfo', { addr: tokenAddress, key: 'select', value: selected }, (err, data) => {
      if (err) {
        console.log('updateTokensInfo failed: ', err);
      } else {
        this.tokensList[tokenAddress].select = selected;
      }
    });
  }

  @action setCurrToken(addr) {
    self.currTokenAddr = addr;
  }

  @action setCurrTokenChain(chain) {
    self.currTokenChain = chain;
  }

  @action getToken(scAddr) {
    let token = this.getTokenInfoFromTokensListByAddr(scAddr);
    if (token && token.ancestor && this.tokensList[token.ancestor]) {
      token.iconData = this.tokensList[token.ancestor].iconData;
      token.iconType = this.tokensList[token.ancestor].iconType;
    }
    return token;
  }

  @action async initTokenIcon(obj) {
    let scAddr = obj.account;
    switch (obj.ancestor) {
      case 'BTC':
        self.tokenIconList[scAddr] = btcImg;
        break;
      case 'ETH':
        self.tokenIconList[scAddr] = ethImg;
        break;
      case 'EOS':
        self.tokenIconList[scAddr] = eosImg;
        break;
      case 'XRP':
        self.tokenIconList[scAddr] = xrpImg;
        break;
      case 'BNB':
        self.tokenIconList[scAddr] = bnbImg;
        break;
      default:
        if (obj.ancestor === 'WAN' && obj.chainSymbol === 'WAN' && obj.symbol === 'WAN') {
          self.tokenIconList[scAddr] = wanImg;
          return;
        }
        wand.request('crossChain_getRegisteredOrigToken', {
          chainType: obj.chainSymbol,
          options: {
            tokenScAddr: scAddr
          }
        }, (err, data) => {
          if (err || data.length === 0 || !(Object.prototype.hasOwnProperty.call(data[0], 'iconData') && Object.prototype.hasOwnProperty.call(data[0], 'iconType'))) {
            self.tokenIconList[scAddr] = `data:image/png;base64,${new Identicon(scAddr).toString()}`;
          } else {
            self.tokenIconList[scAddr] = `data:image/${data[0].iconType};base64,${data[0].iconData}`;
          }
        });
    }
  }

  @action async setTokenIcon(scAddr) {
    const token = self.getToken(scAddr);
    if (token === undefined) {
      return false;
    }
    if (token && token.iconData) {
      self.tokenIconList[scAddr] = `data:image/${token.iconType};base64,${token.iconData}`;
    } else {
      wand.request('crossChain_getRegisteredOrigToken', {
        chainType: token.chain,
        options: {
          tokenScAddr: scAddr
        }
      }, (err, data) => {
        if (err || data.length === 0 || !(Object.prototype.hasOwnProperty.call(data[0], 'iconData') && Object.prototype.hasOwnProperty.call(data[0], 'iconType'))) {
          self.tokenIconList[scAddr] = `data:image/png;base64,${new Identicon(scAddr).toString()}`;
        } else {
          self.tokenIconList[scAddr] = `data:image/${data[0].iconType};base64,${data[0].iconData}`;
        }
      });
    }
  }

  getCoinImage = (chain, addr = false) => {
    let img;
    switch (chain.toUpperCase()) {
      case 'WAN':
        img = wanImg;
        break;
      case 'ETH':
        img = ethImg;
        break;
      case 'BTC':
        img = btcImg;
        break;
      case 'EOS':
        img = eosImg;
        break;
      case 'BNB':
        img = bnbImg;
        break;
      default:
        if (addr) {
          if (!this.tokenIconList[addr]) {
            this.setTokenIcon(addr);
          }
          img = this.tokenIconList[addr];
        }
    }
    return img;
  }

  @action getTokensInfo() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getTokensInfo', {}, (err, data) => {
        if (err) {
          console.log('getTokensInfo: ', err);
          reject(err)
          return;
        }
        self.tokensList = data;
        resolve()
      })
    })
  }

  @action addCustomToken(tokenInfo) {
    let { key } = tokenInfo;
    self.tokensList[key.toLowerCase()] = {
      account: tokenInfo.account,
      ancestor: tokenInfo.ancestor,
      chainSymbol: tokenInfo.chainSymbol,
      select: tokenInfo.select,
      chain: tokenInfo.chain,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
      isCustomToken: tokenInfo.isCustomToken,
    }
  }

  @action deleteCustomToken(tokenAddr) {
    delete self.tokensList[tokenAddr.toLowerCase()];
  }

  @action updateTokensBalance(tokenScAddr, chain = 'WAN') {
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined || tokenScAddr === undefined) {
      return;
    }
    let normalArr = Object.keys(addrInfo.normal || {});
    let importArr = Object.keys(addrInfo.import || {});
    let ledgerArr = Object.keys(addrInfo.ledger || {});
    let trezorArr = Object.keys(addrInfo.trezor || {});
    let rawKeyArr = Object.keys(addrInfo.rawKey || {});
    let addresses = normalArr.concat(importArr, ledgerArr, trezorArr, rawKeyArr);
    wand.request('crossChain_updateTokensBalance', { address: addresses, tokenScAddr, chain }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      let addresses = Object.keys(data);
      if (addresses.length === 0) {
        self.tokensBalance[tokenScAddr] = data;
      } else {
        let obj = {};
        addresses.forEach(key => {
          obj[key.toLowerCase()] = data[key];
        });
        self.tokensBalance[tokenScAddr] = obj;
      }
    })
  }

  getCoinsListInfo_2way(chain, chainID) {
    let addressObj = this.getChainAddressInfoByChain(chain);
    if (addressObj === undefined) {
      return [];
    }
    let addrList = [];
    let normal = addressObj.normal || {};
    let ledger = addressObj.ledger || {};
    let trezor = addressObj.trezor || {};
    let addresses = Object.assign({}, normal, ledger, trezor);
    Object.keys(addresses).forEach(item => {
      let balance = addresses[item].balance;
      addrList.push({
        key: item,
        name: addresses[item].name,
        address: item,
        balance,
        path: String(addresses[item].path).startsWith('m/') ? addresses[item].path : `m/44'/${chain === 'BNB' ? 60 : (Number(chainID) - Number('0x80000000'.toString(10)))}'/0'/0/${addresses[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  getTokensListInfo_2way(chain, chainID, SCAddress) {
    let addressObj = this.getChainAddressInfoByChain(chain);
    if (addressObj === undefined) {
      return [];
    }

    let addrList = [];
    let normal = addressObj.normal;
    let ledger = addressObj.ledger || {};
    let trezor = addressObj.trezor || {};
    let addresses = Object.assign({}, normal, ledger, trezor);
    Object.keys(addresses).forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[SCAddress]) {
        let tokenInfo = this.getTokenInfoFromTokensListByAddr(SCAddress);
        if (self.tokensList && tokenInfo) {
          balance = formatNumByDecimals(self.tokensBalance[SCAddress][item.toLowerCase()], tokenInfo.decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }
      addrList.push({
        key: item,
        name: addresses[item].name,
        address: item,
        balance,
        path: String(addresses[item].path).startsWith('m/') ? addresses[item].path : `m/44'/${chain === 'BNB' ? 60 : (Number(chainID) - Number('0x80000000'.toString(10)))}'/0'/0/${addresses[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  @action getTokenBalance(item) {
    let { chainSymbol, scAddr } = item;
    scAddr = scAddr.replace(/^.*-/, '');
    return new Promise((resolve, reject) => {
      let normalArr = [];
      let importArr = [];
      let ledgerArr = [];
      let trezorArr = [];
      let rawKeyArr = [];

      switch (chainSymbol) {
        case 'WAN':
          normalArr = Object.keys(wanAddress.addrInfo['normal'] || {});
          importArr = Object.keys(wanAddress.addrInfo['import'] || {});
          ledgerArr = Object.keys(wanAddress.addrInfo['ledger'] || {});
          trezorArr = Object.keys(wanAddress.addrInfo['trezor'] || {});
          rawKeyArr = Object.keys(wanAddress.addrInfo['rawKey'] || {});
          break;
        case 'ETH':
          normalArr = Object.keys(ethAddress.addrInfo['normal'] || {});
          importArr = Object.keys(ethAddress.addrInfo['import'] || {});
          rawKeyArr = Object.keys(ethAddress.addrInfo['rawKey'] || {});
          break;
        case 'BTC':
          normalArr = Object.keys(btcAddress.addrInfo['normal'] || {});
          importArr = Object.keys(btcAddress.addrInfo['import'] || {});
          rawKeyArr = Object.keys(btcAddress.addrInfo['rawKey'] || {});
          break;
        case 'EOS':
          // console.log('EOS Balance:', item)
          normalArr = Object.keys(eosAddress.keyInfo['normal']);
          rawKeyArr = Object.keys(eosAddress.keyInfo['rawKey']);
          break;
        case 'XRP':
          normalArr = Object.keys(xrpAddress.keyInfo.normal);
          rawKeyArr = Object.keys(xrpAddress.keyInfo.rawKey);
          break;
        case 'BNB':
          normalArr = Object.keys(bnbAddress.addrInfo['normal'] || {});
          importArr = Object.keys(bnbAddress.addrInfo['import'] || {});
          rawKeyArr = Object.keys(bnbAddress.addrInfo['rawKey'] || {});
          break;
        default:
        // console.log('Default.....');
      }

      if ((normalArr.length || importArr.length || rawKeyArr.length) === 0) {
        return {};
      }
      wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr).concat(ledgerArr).concat(trezorArr).concat(rawKeyArr), tokenScAddr: scAddr, chain: chainSymbol }, (err, data) => {
        if (err) {
          resolve({});
        } else {
          resolve(data);
        }
      });
    });
  }

  @action updateTokensList(addr, value) {
    // rewrite for fnx
    if (value.account === FNX_POOL_TESTNET || value.account === FNX_POOL_MAINNET) {
      delete this.tokensList[addr];
      return;
    }

    wand.request('crossChain_updateTokensInfo', { addr, key: undefined, value }, (err) => {
      if (err) {
        console.log('crossChain_updateTokensInfo: ', err);
      } else {
        this.tokensList[addr] = value;
      }
    });
  }

  @action updateChainBalanceList(chain) {
    if (typeof chain === 'string' && chain !== '') {
      self.chainBalanceList = [chain]
    } else if (chain instanceof Array) {
      self.chainBalanceList = chain
    } else {
      self.chainBalanceList = chain === '' ? [...self.selectedChain] : []
    }
  }

  @computed get selectedChain() {
    let normalChainSelected = Object.values(self.getWalletSelections).filter(v => v.children.some(i => i.selected)).map(s => s.ancestor)
    let crosschainSelected = Object.keys(crossChain.crossChainSelections).filter(v => crossChain.crossChainSelections[v].some(i => i.selected))
    return new Set(normalChainSelected.concat(crosschainSelected))
  }

  @computed get getTokenList() {
    let list = [];
    if (!(self.tokensList instanceof Object)) {
      return [];
    }
    Object.keys(self.tokensList).forEach(item => {
      let val = self.tokensList[item];
      list.push({
        addr: item,
        chain: val.chain,
        symbol: val.symbol,
        decimals: val.decimals,
        ancestor: val.ancestor,
        select: val.select
      })
    })
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  @computed get allTokenSymbols() {
    return Object.values(this.tokensList).map(item => item.symbol);
  }

  @computed get getWalletTokenList() {
    return this.walletTokensList.slice();
  }

  @computed get tokensOnSideBar() {
    let list = [];
    Object.keys(this.tokensList).forEach(item => {
      let val = this.tokensList[item];
      if (val.select) {
        list.push({
          chain: val.chain,
          chainSymbol: val.chainSymbol,
          tokenAddr: item,
          symbol: val.symbol,
          ancestor: val.ancestor,
          decimals: val.decimals,
        })
      }
    });
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  @computed get getTokensListInfo() {
    const chain = this.currTokenChain;
    if (chain === undefined || chain === '') {
      return [];
    }
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let addrList = [];
    [addrInfo.normal, addrInfo.ledger || {}, addrInfo.trezor || {}, addrInfo.import || {}, addrInfo.rawKey || {}].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        let pathPrefix = this.getPathPrefix(chain);
        if (this.tokensBalance && this.tokensBalance[this.currTokenAddr]) {
          let token = this.getTokenInfoFromTokensListByAddr(this.currTokenAddr);
          if (this.tokensList && token !== undefined) {
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item.toLowerCase()], token.decimals)
          } else {
            balance = 0
          }
        } else {
          balance = 0;
        }

        addrList.push({
          key: item,
          name: obj[item].name,
          address: item,
          balance,
          path: String(obj[item].path).startsWith('m/44') ? obj[item].path : `${pathPrefix}${obj[item].path}`,
          action: 'send',
          amount: balance
        });
      });
    });
    return addrList;
  }

  @computed get getCCTokensListInfo() {
    const chain = this.currTokenChain;
    if (chain === undefined || chain === '') {
      return [];
    }
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let addrList = [];
    [addrInfo.normal/* , addrInfo.ledger || {}, addrInfo.trezor || {} */].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        let pathPrefix = this.getPathPrefix(chain);
        if (this.tokensBalance && this.tokensBalance[this.currTokenAddr]) {
          let token = this.getTokenInfoFromTokensListByAddr(this.currTokenAddr);
          if (this.tokensList && token !== undefined) {
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item.toLowerCase()], token.decimals)
          } else {
            balance = 0
          }
        } else {
          balance = 0;
        }
        addrList.push({
          key: item,
          name: obj[item].name,
          address: item,
          balance,
          path: String(obj[item].path).startsWith('m/44') ? obj[item].path : `${pathPrefix}${obj[item].path}`,
          action: 'send',
          amount: balance
        });
      });
    });
    return addrList;
  }

  @computed get getTokenAmount() {
    if (this.currTokenAddr.length === 0) {
      return 0;
    }
    let amount = new BigNumber(0);
    this.getTokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    });
    return formatNum(amount.toString(10));
  }

  @computed get getWalletSelections() {
    let selections = {};
    // console.log('tokensList:', JSON.parse(JSON.stringify(this.tokensList)))
    Object.keys(this.tokensList).forEach(key => {
      let v = this.tokensList[key];
      if (!selections[v.ancestor]) {
        selections[v.ancestor] = {
          symbol: v.ancestor,
          ancestor: v.ancestor,
          key: v.ancestor,
          children: []
        };
      }
      let route = '';
      if (v.account === COIN_ACCOUNT || v.account === COIN_ACCOUNT_EOS) { // Coin
        route = `/${v.symbol.toLowerCase()}Account`;
      } else { // Token
        route = `/tokens/${v.chainSymbol}/${v.account}/${v.symbol}`;
      }
      let child = {
        title: v.chain,
        symbol: v.symbol,
        name: v.name,
        key: route,
        account: v.account,
        toAccount: key,
        selected: v.select,
        isCustomToken: !!v.isCustomToken,
        isOriginalChain: v.ancestor === v.chainSymbol
      }
      selections[v.ancestor].children.push(child);
    });

    let result = Object.values(selections).sort((m, n) => {
      return Number(TOKEN_PRIORITY[m.ancestor] === undefined ? 0 : TOKEN_PRIORITY[m.ancestor]) > Number(TOKEN_PRIORITY[n.ancestor] === undefined ? 0 : TOKEN_PRIORITY[n.ancestor]) ? -1 : 1;
    });

    // Add BNB
    result.push({
      ancestor: 'BNB',
      key: 'BNB',
      symbol: 'BNB',
      children: [{
        account: '0x0000000000000000000000000000000000000000',
        isCustomToken: false,
        isOriginalChain: true,
        key: '/bnbAccount',
        selected: true,
        symbol: 'BNB',
        title: 'BSC',
        toAccount: '2147483708-0x0000000000000000000000000000000000000000'
      }]
    });

    return result;
  }

  getTokenInfoFromTokensListByAddr(addr) {
    let ret = Object.values(this.tokensList).find(obj => obj.account === addr);

    // add for FNX crosschain
    if (!ret) {
      ret = Object.keys(this.tokensList).find(key => key.includes(addr));
      ret = this.tokensList[ret];
    }
    return ret;
  }

  getChainAddressInfoByChain(chain) {
    const ADDRESSES = { wanAddress, ethAddress, btcAddress, eosAddress, xrpAddress, bnbAddress };
    if (chain === undefined) {
      return undefined;
    }

    if (ADDRESSES[`${chain.toLowerCase()}Address`] === undefined) {
      return undefined;
    } else if (chain.toLowerCase() === 'eos') {
      return ADDRESSES[`${chain.toLowerCase()}Address`].keyInfo;
    } else {
      return ADDRESSES[`${chain.toLowerCase()}Address`].addrInfo;
    }
  }

  getChainStoreInfoByChain(chain) {
    const ADDRESSES = { wanAddress, ethAddress, btcAddress, eosAddress, xrpAddress, bnbAddress };
    if (ADDRESSES[`${chain.toLowerCase()}Address`] === undefined) {
      return undefined;
    } else {
      return ADDRESSES[`${chain.toLowerCase()}Address`];
    }
  }

  getPathPrefix(chain) {
    let pathPrefix;
    switch (chain) {
      case 'WAN':
        pathPrefix = WANPATH;
        break;
      case 'ETH':
        pathPrefix = ETHPATH;
        break;
      case 'EOS':
        pathPrefix = EOSPATH;
        break;
      case 'BTC':
        if (session.isMainNetwork) {
          pathPrefix = BTCPATH_MAIN;
        } else {
          pathPrefix = BTCPATH_TEST;
        }
        break;
      case 'BNB':
        pathPrefix = BSCPATH;
        break;
      default:
        pathPrefix = WANPATH;
    }
    return pathPrefix;
  }
}

const self = new Tokens();
export default self;
