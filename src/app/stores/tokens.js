import BigNumber from 'bignumber.js';
import { observable, action, computed } from 'mobx';
import Identicon from 'identicon.js';
import btcImg from 'static/image/btc.png';
import ethImg from 'static/image/eth.png';
import eosImg from 'static/image/eos.png';
import wanImg from 'static/image/wan.png';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import session from './session';

import { formatNum, formatNumByDecimals } from 'utils/support';
import { WANPATH, ETHPATH, EOSPATH, BTCPATH_MAIN, BTCPATH_TEST, COIN_ACCOUNT, COIN_ACCOUNT_EOS, TOKEN_PRIORITY, WALLETID } from 'utils/settings';

class Tokens {
  @observable currTokenAddr = '';

  @observable currTokenChain = '';

  @observable tokensList = {}; // Tokens collection

  @observable tokensBalance = {};

  @observable tokenIconList = {};

  @observable walletSelections = {};

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
          // console.log('init icon:', obj.symbol, data);
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
      self.tokensBalance[tokenScAddr] = data;
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
      let wid = WALLETID.NATIVE;
      if (Object.prototype.hasOwnProperty.call(ledger, item)) {
        wid = WALLETID.LEDGER;
      }
      if (Object.prototype.hasOwnProperty.call(trezor, item)) {
        wid = WALLETID.TREZOR;
      }
      let balance = addresses[item].balance;
      addrList.push({
        key: item,
        name: addresses[item].name,
        address: item,
        balance,
        path: String(addresses[item].path).startsWith('m/') ? addresses[item].path : `m/44'/${Number(chainID) - Number('0x80000000'.toString(10))}'/0'/0/${addresses[item].path}`,
        action: 'send',
        amount: balance,
        wid
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
    // let ledger = addressObj.ledger || {};
    // let trezor = addressObj.trezor || {};
    let ledger = chain === 'WAN' ? (addressObj.ledger || {}) : {};
    let trezor = chain === 'WAN' ? (addressObj.trezor || {}) : {};
    let addresses = Object.assign({}, normal, ledger, trezor);
    Object.keys(addresses).forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[SCAddress]) {
        let tokenInfo = this.getTokenInfoFromTokensListByAddr(SCAddress);
        if (self.tokensList && tokenInfo) {
          balance = formatNumByDecimals(self.tokensBalance[SCAddress][item], tokenInfo.decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }
      let wid = WALLETID.NATIVE;
      if (Object.prototype.hasOwnProperty.call(ledger, item)) {
        wid = WALLETID.LEDGER;
      }
      if (Object.prototype.hasOwnProperty.call(trezor, item)) {
        wid = WALLETID.TREZOR;
      }
      addrList.push({
        key: item,
        name: addresses[item].name,
        address: item,
        balance,
        path: String(addresses[item].path).startsWith('m/') ? addresses[item].path : `m/44'/${Number(chainID) - Number('0x80000000'.toString(10))}'/0'/0/${addresses[item].path}`,
        action: 'send',
        amount: balance,
        wid
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
    wand.request('crossChain_updateTokensInfo', { addr, key: undefined, value }, (err) => {
      if (err) {
        console.log('crossChain_updateTokensInfo: ', err);
      } else {
        this.tokensList[addr] = value;
      }
    });
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
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item], token.decimals)
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

  @computed get getCCTokensListInfo() { // Normal accounts only
    const chain = this.currTokenChain;
    if (chain === undefined || chain === '') {
      return [];
    }
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let addrList = [];
    [addrInfo.normal].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        let pathPrefix = this.getPathPrefix(chain);
        if (this.tokensBalance && this.tokensBalance[this.currTokenAddr]) {
          let token = this.getTokenInfoFromTokensListByAddr(this.currTokenAddr);
          if (this.tokensList && token !== undefined) {
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item], token.decimals)
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

  @computed get getCCTokensListInfoWithHW() { // Ledger & Trezor accounts included
    const chain = this.currTokenChain;
    if (chain === undefined || chain === '') {
      return [];
    }
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let addrList = [];
    [addrInfo.normal, addrInfo.ledger || {}, addrInfo.trezor || {}].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        let pathPrefix = this.getPathPrefix(chain);
        if (this.tokensBalance && this.tokensBalance[this.currTokenAddr]) {
          let token = this.getTokenInfoFromTokensListByAddr(this.currTokenAddr);
          if (this.tokensList && token !== undefined) {
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item], token.decimals)
          } else {
            balance = 0
          }
        } else {
          balance = 0;
        }
        let wid = WALLETID.NATIVE;
        if (Object.prototype.hasOwnProperty.call(addrInfo.ledger, item)) {
          wid = WALLETID.LEDGER;
        }
        if (Object.prototype.hasOwnProperty.call(addrInfo.trezor, item)) {
          wid = WALLETID.TREZOR;
        }
        addrList.push({
          key: item,
          name: obj[item].name,
          address: item,
          balance,
          path: String(obj[item].path).startsWith('m/44') ? obj[item].path : `${pathPrefix}${obj[item].path}`,
          action: 'send',
          amount: balance,
          wid
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
    return Object.values(selections).sort((m, n) => {
      return Number(TOKEN_PRIORITY[m.ancestor] === undefined ? 0 : TOKEN_PRIORITY[m.ancestor]) > Number(TOKEN_PRIORITY[n.ancestor] === undefined ? 0 : TOKEN_PRIORITY[n.ancestor]) ? -1 : 1;
    });
  }

  getTokenInfoFromTokensListByAddr(addr) {
    return Object.values(this.tokensList).find(obj => obj.account === addr);
  }

  getChainAddressInfoByChain(chain) {
    const ADDRESSES = { wanAddress, ethAddress, btcAddress, eosAddress };
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
    const ADDRESSES = { wanAddress, ethAddress, btcAddress, eosAddress };
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
        if (session.chainId === 1) {
          pathPrefix = BTCPATH_MAIN;
        } else {
          pathPrefix = BTCPATH_TEST;
        }
        break;
      default:
        pathPrefix = WANPATH;
    }
    return pathPrefix;
  }
}

const self = new Tokens();
export default self;
