import wanUtil from 'wanchain-util';
import BigNumber from 'bignumber.js';
import { observable, action, computed, toJS, autorun } from 'mobx';
import Identicon from 'identicon.js';
import btcImg from 'static/image/btc.png';
import ethImg from 'static/image/eth.png';
import eosImg from 'static/image/eos.png';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import session from './session';

import { formatNum, formatNumByDecimals, formatTokensList } from 'utils/support';
import { WANPATH, ETHPATH, EOSPATH, BTCPATH_MAIN, BTCPATH_TEST, CROSSCHAINTYPE, COIN_ACCOUNT, COIN_ACCOUNT_EOS } from 'utils/settings';
import { getBalance } from 'utils/helper';

class Tokens {
  @observable currTokenAddr = '';

  @observable currTokenChain = '';

  @observable tokensList = {}; // Tokens collection

  @observable ccTokensList = {};

  @observable tokensBalance = {};

  @observable E20TokensBalance = {}; // Included in tokensBalance

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

  @action setCurrToken(addr, symbol) {
    if (symbol) {
      addr = Object.keys(self.formatTokensList).find(item => self.formatTokensList[item].symbol === symbol)
    }
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

  @action async getTokenIcon(scAddr) {
    const token = self.getToken(scAddr);
    if (token === undefined) {
      return false;
    }
    switch (token.symbol) {
      case 'WBTC':
        self.tokenIconList[scAddr] = btcImg;
        break;
      case 'WETH':
        self.tokenIconList[scAddr] = ethImg;
        break;
      case 'WEOS':
        self.tokenIconList[scAddr] = eosImg;
        break;
      default:
        if (token && token.iconData) {
          self.tokenIconList[scAddr] = `data:image/${token.iconType};base64,${token.iconData}`;
        } else {
          wand.request('crossChain_getRegisteredOrigToken', {
            chainType: token.chain,
            options: {
              tokenScAddr: scAddr
            }
          }, (err, data) => {
            // console.log('get Icon: ', err, data)
            if (err || data.length === 0 || !(Object.prototype.hasOwnProperty.call(data[0], 'iconData') && Object.prototype.hasOwnProperty.call(data[0], 'iconType'))) {
              self.tokenIconList[scAddr] = `data:image/png;base64,${new Identicon(scAddr).toString()}`;
            } else {
              self.tokenIconList[scAddr] = `data:image/${data[0].iconType};base64,${data[0].iconData}`;
            }
          });
        }
    }
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

  @action getCcTokensInfo() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getCcTokensInfo', {}, (err, data) => {
        if (err) {
          console.log('getCcTokensInfo: ', err);
          reject(err)
          return;
        }
        self.ccTokensList = data;
        resolve()
      })
    })
  }

  @computed get formatTokensList() {
    return formatTokensList(self.ccTokensList)
  }

  @action addCustomToken(tokenInfo) {
    let { tokenAddr } = tokenInfo;
    self.tokensList[tokenAddr.toLowerCase()] = {
      select: tokenInfo.select,
      chain: tokenInfo.chain,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals
    }
  }

  @action deleteCustomToken(tokenAddr) {
    delete self.tokensList[tokenAddr.toLowerCase()];
  }

  @action updateTokensBalance(tokenScAddr, chain = 'WAN') {
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let normalArr = Object.keys(addrInfo.normal || []);
    let importArr = Object.keys(addrInfo.import || []);
    let ledgerArr = Object.keys(addrInfo.ledger || []);
    let trezorArr = Object.keys(addrInfo.trezor || []);
    let rawKeyArr = Object.keys(addrInfo.rawKey || []);
    let addresses = normalArr.concat(importArr, ledgerArr, trezorArr, rawKeyArr);
    wand.request('crossChain_updateTokensBalance', { address: addresses, tokenScAddr, chain }, (err, data) => {
      // console.log('result:', err, data)
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
    let normal = addressObj.normal || [];
    let ledger = addressObj.ledger || [];
    let trezor = addressObj.trezor || [];
    let addresses = Object.assign({}, normal, ledger, trezor);
    Object.keys(addresses).forEach(item => {
      let balance = addresses[item].balance;
      addrList.push({
        key: item,
        name: addresses[item].name,
        address: wanUtil.toChecksumAddress(item),
        balance: formatNum(balance),
        path: `m/44'/${Number(chainID) - Number('0x80000000'.toString(10))}'/0'/0/${addresses[item].path}`,
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
    let ledger = addressObj.ledger || [];
    let trezor = addressObj.trezor || [];
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

      addrList.push({
        key: item,
        name: addresses[item].name,
        address: wanUtil.toChecksumAddress(item),
        balance: formatNum(balance),
        path: `m/44'/${Number(chainID) - Number('0x80000000'.toString(10))}'/0'/0/${addresses[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  @action getTokenBalance(item) {
    let { chain, scAddr } = item;
    scAddr = scAddr.replace(/^.*-/, '');
    return new Promise((resolve, reject) => {
      let normalArr = [];
      let importArr = [];
      let ledgerArr = [];
      let trezorArr = [];
      let rawKeyArr = [];

      switch (chain) {
        case 'WAN':
          normalArr = Object.keys(wanAddress.addrInfo['normal'] || []);
          importArr = Object.keys(wanAddress.addrInfo['import'] || []);
          ledgerArr = Object.keys(wanAddress.addrInfo['ledger'] || []);
          trezorArr = Object.keys(wanAddress.addrInfo['trezor'] || []);
          rawKeyArr = Object.keys(wanAddress.addrInfo['rawKey'] || []);
          break;
        case 'ETH':
          normalArr = Object.keys(ethAddress.addrInfo['normal'] || []);
          importArr = Object.keys(ethAddress.addrInfo['import'] || []);
          rawKeyArr = Object.keys(ethAddress.addrInfo['rawKey'] || []);
          break;
        case 'BTC':
          normalArr = Object.keys(btcAddress.addrInfo['normal'] || []);
          importArr = Object.keys(btcAddress.addrInfo['import'] || []);
          rawKeyArr = Object.keys(btcAddress.addrInfo['rawKey'] || []);
          break;
        case 'EOS':
          /* normalArr = Object.keys(eosAddress.keyInfo['normal']);
          importArr = Object.keys(eosAddress.keyInfo['import']); */
          break;
        default:
        // console.log('Default.....');
      }

      if ((normalArr.length || importArr.length || rawKeyArr.length) === 0) {
        return {};
      }
      // console.log('p:', { address: normalArr.concat(importArr).concat(ledgerArr).concat(trezorArr).concat(rawKeyArr), tokenScAddr: scAddr, chain: chain })
      wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr).concat(ledgerArr).concat(trezorArr).concat(rawKeyArr), tokenScAddr: scAddr, chain: chain }, (err, data) => {
        // console.log(err, data);
        if (err) {
          console.log('stores_getTokensBalance:', err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  @action updateE20TokensBalance(tokenScAddr) {
    let normalArr = Object.keys(ethAddress.addrInfo.normal);
    let rawKeyArr = Object.keys(ethAddress.addrInfo.rawKey);
    wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(rawKeyArr), tokenScAddr, chain: 'ETH' }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.E20TokensBalance[tokenScAddr] = data;
    })
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

  /* @action updateTokensInfo(addr, key, value) {
    wand.request('crossChain_updateTokensInfo', { addr, key, value }, (err) => {
      if (err) {
        console.log('crossChain_updateTokensInfo: ', err)
        return;
      }
      self.tokensList[addr][key] = value;
    })
  } */

  @action updateCcTokensInfo(addr, key, value) {
    wand.request('crossChain_updateCcTokensInfo', { addr, key, value }, (err) => {
      if (err) {
        console.log('crossChain_updateCcTokensInfo: ', err)
        return;
      }
      self.ccTokensList[addr][key] = value;
    })
  }

  @action addWrc20Tokens(scInfo) {
    const { addr } = scInfo;
    if (addr) {
      self.wrc20List.addr = { ...scInfo };
    }
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

  @computed get ccTokens() {
    let excludedList = CROSSCHAINTYPE;
    let list = [];
    if (!(self.ccTokensList instanceof Object)) {
      return [];
    }
    Object.keys(self.ccTokensList).forEach(item => {
      try {
        let val = self.ccTokensList[item];
        if (!excludedList.includes(item)) {
          list.push({
            addr: item,
            chain: val.chain,
            symbol: val.symbol,
            decimals: val.decimals,
            select: val.select
          })
        }
      } catch (err) {
        console.log(`Get cross chain ${item} failed`, err);
      }
    })
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  @computed get ccTokensSiderbar() {
    let list = [];
    if (!(self.ccTokensList instanceof Object)) {
      return [];
    }
    Object.keys(self.ccTokensList).forEach(item => {
      try {
        let val = self.ccTokensList[item];
        if (!CROSSCHAINTYPE.includes(item)) {
          list.push({
            tokenAddr: val.wan_addr,
            tokenOrigAddr: val.chain === 'EOS' ? wand.ccUtil.encodeAccount('EOS', item) : item,
            chain: val.chain,
            symbol: val.symbol,
            decimals: val.decimals,
            select: val.select
          })
        }
      } catch (err) {
        console.log(`Get cross chain ${item} failed`, err);
      }
    })
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
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
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo.normal);
    normalArr.forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[self.currTokenAddr]) {
        if (self.tokensList && self.tokensList[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.tokensBalance[self.currTokenAddr][item], self.tokensList[self.currTokenAddr].decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }
      addrList.push({
        key: item,
        name: wanAddress.addrInfo.normal[item].name,
        address: wanUtil.toChecksumAddress(item),
        balance: formatNum(balance),
        path: `${WANPATH}${wanAddress.addrInfo.normal[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  @computed get getTokensListInfo_ByChain() {
    const chain = this.currTokenChain;
    let addrInfo = this.getChainAddressInfoByChain(chain);
    if (addrInfo === undefined) {
      return;
    }
    let addrList = [];
    [addrInfo.normal, addrInfo.ledger || {}, addrInfo.trezor || {}].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        let pathPrefix = '';
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
            //  network = 1 ? 'main' : 'testnet',
            if (session.chainId === 1) {
              pathPrefix = BTCPATH_MAIN;
            } else {
              pathPrefix = BTCPATH_TEST;
            }
            break;
          default:
            pathPrefix = WANPATH;
        }
        if (this.tokensBalance && this.tokensBalance[this.currTokenAddr]) {
          let tokenKey = Object.keys(this.tokensList).find(key => key.indexOf(this.currTokenAddr) !== -1);
          if (this.tokensList && tokenKey && this.tokensList[tokenKey]) {
            balance = formatNumByDecimals(this.tokensBalance[this.currTokenAddr][item], this.tokensList[tokenKey].decimals)
          } else {
            balance = 0
          }
        } else {
          balance = 0;
        }
        addrList.push({
          key: item,
          name: obj[item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: formatNum(balance),
          path: `${pathPrefix}${obj[item].path}`,
          action: 'send',
          amount: balance
        });
      });
    });
    return addrList;
  }

  @computed get getE20TokensListInfo() {
    let addrList = [];
    let normalArr = Object.keys(ethAddress.addrInfo.normal);
    normalArr.forEach(item => {
      let balance;
      if (self.formatTokensList && self.formatTokensList[self.currTokenAddr]) {
        let tokenOrigAddr = self.formatTokensList[self.currTokenAddr].tokenOrigAddr;
        if (self.E20TokensBalance && self.E20TokensBalance[tokenOrigAddr]) {
          balance = formatNumByDecimals(self.E20TokensBalance[tokenOrigAddr][item], self.formatTokensList[self.currTokenAddr].decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }
      addrList.push({
        key: item,
        name: ethAddress.addrInfo.normal[item].name,
        address: item,
        balance: formatNum(balance),
        path: `${ETHPATH}${ethAddress.addrInfo.normal[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  @computed get getE20TokensInfo() {
    let addrList = [];
    let normal = ethAddress.addrInfo.normal;
    let rawKey = ethAddress.addrInfo.rawKey;
    [normal, rawKey].forEach(obj => {
      Object.keys(obj).forEach(item => {
        let balance;
        if (self.E20TokensBalance && self.E20TokensBalance[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.E20TokensBalance[self.currTokenAddr][item], self.tokensList[self.currTokenAddr].decimals)
        } else {
          balance = 0
        }
        addrList.push({
          key: item,
          name: obj[item].name,
          address: item,
          balance: formatNum(balance),
          path: `${ETHPATH}${obj[item].path}`,
          action: 'send',
          amount: balance
        });
      });
    });
    return addrList;
  }

  @computed get getTokenAmount() {
    let amount = new BigNumber(0);
    let importArr = Object.keys(wanAddress.addrInfo.import);
    let ledgerArr = Object.keys(wanAddress.addrInfo.ledger);
    let trezorArr = Object.keys(wanAddress.addrInfo.trezor);
    let rawKeyArr = Object.keys(wanAddress.addrInfo.rawKey);

    self.getTokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    });
    importArr.concat(ledgerArr, trezorArr, rawKeyArr).forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[self.currTokenAddr]) {
        if (self.tokensList && self.tokensList[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.tokensBalance[self.currTokenAddr][item], self.tokensList[self.currTokenAddr].decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }

      amount = amount.plus(balance);
    })
    return formatNum(amount.toString(10));
  }

  @computed get getE20TokenAmount() {
    let amount = new BigNumber(0);

    self.getE20TokensInfo.forEach(item => {
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
          symbol: v.symbol,
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
      selections[v.ancestor].children.push({
        title: v.chain,
        symbol: v.symbol,
        name: v.name,
        key: route,
        account: v.account,
        toAccount: key,
        selected: v.select,
      });
    });
    return Object.values(selections);
  }

  getTokenInfoFromTokensListByAddr(addr) {
    return Object.values(this.tokensList).find(obj => obj.account === addr);
  }

  getChainAddressInfoByChain(chain) {
    const ADDRESSES = { wanAddress, ethAddress };
    if (ADDRESSES[`${chain.toLowerCase()}Address`] === undefined) {
      return undefined;
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
}

const self = new Tokens();
export default self;
