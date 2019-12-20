import wanUtil from 'wanchain-util';
import BigNumber from 'bignumber.js';
import { observable, action, computed, toJS } from 'mobx';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import { formatNum, formatNumByDecimals, formatTokensList } from 'utils/support';
import { WANPATH, ETHPATH, WALLET_CHAIN, CROSSCHAINTYPE } from 'utils/settings';

class Tokens {
  @observable currTokenAddr = '';

  @observable tokensList = {};

  @observable ccTokensList = {};

  @observable tokensBalance = {};

  @observable E20TokensBalance = {};

  @action setCurrToken(addr, symbol) {
    if (symbol) {
      addr = Object.keys(self.formatTokensList).find(item => self.formatTokensList[item].symbol === symbol)
    }
    self.currTokenAddr = addr;
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
      select: false,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals
    }
  }

  @action deleteCustomToken (tokenAddr) {
    delete self.tokensList[tokenAddr.toLowerCase()];
  }

  @action updateTokensBalance (tokenScAddr) {
    let normalArr = Object.keys(wanAddress.addrInfo.normal);
    let importArr = Object.keys(wanAddress.addrInfo.import);
    wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr), tokenScAddr, chain: 'WAN' }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.tokensBalance[tokenScAddr] = data;
    })
  }

  @action updateE20TokensBalance(tokenScAddr) {
    let normalArr = Object.keys(ethAddress.addrInfo.normal);
    wand.request('crossChain_updateTokensBalance', { address: normalArr, tokenScAddr, chain: 'ETH' }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.E20TokensBalance[tokenScAddr] = data;
    })
  }

  @action updateTokensInfo(addr, key, value) {
    wand.request('crossChain_updateTokensInfo', { addr, key, value }, (err) => {
      if (err) {
        console.log('crossChain_updateTokensInfo: ', err)
        return;
      }
      self.tokensList[addr][key] = value;
    })
  }

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
    Object.keys(self.tokensList).forEach(item => {
      let val = self.tokensList[item];
      list.push({
        addr: item,
        chain: val.chain,
        symbol: val.symbol,
        decimals: val.decimals,
        buddy: val.buddy,
        select: val.select
      })
    })
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  @computed get ccTokens() {
    let excludedList = CROSSCHAINTYPE;
    let list = [];
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
    Object.keys(self.tokensList).forEach(item => {
      let val = self.tokensList[item];
      if (val.select) {
        list.push({
          chain: val.chain,
          tokenAddr: item,
          symbol: val.symbol
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
        if (self.formatTokensList && self.formatTokensList[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.tokensBalance[self.currTokenAddr][item], self.formatTokensList[self.currTokenAddr].decimals)
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

  @computed get getTokensListInfo_2WanTypes() {
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo.normal);
    let importArr = Object.keys(wanAddress.addrInfo.import);
    normalArr.concat(importArr).forEach((item, index) => {
      let balance;
      let type = normalArr.length - 1 < index ? 'import' : 'normal';
      if (self.tokensBalance && self.tokensBalance[self.currTokenAddr]) {
        if (self.formatTokensList && self.formatTokensList[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.tokensBalance[self.currTokenAddr][item], self.formatTokensList[self.currTokenAddr].decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }
      addrList.push({
        key: item,
        name: wanAddress.addrInfo[type][item].name,
        address: wanUtil.toChecksumAddress(item),
        balance: formatNum(balance),
        path: `${WANPATH}${wanAddress.addrInfo[type][item].path}`,
        action: 'send',
        amount: balance
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
    let normalArr = Object.keys(ethAddress.addrInfo.normal);
    normalArr.forEach(item => {
      let balance;
      if (self.E20TokensBalance && self.E20TokensBalance[self.currTokenAddr]) {
        balance = formatNumByDecimals(self.E20TokensBalance[self.currTokenAddr][item], self.tokensList[self.currTokenAddr].decimals)
      } else {
        balance = 0
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

  @computed get getTokenAmount() {
    let amount = new BigNumber(0);
    let importArr = Object.keys(wanAddress.addrInfo.import);

    self.getTokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    });
    importArr.forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[self.currTokenAddr]) {
        if (self.formatTokensList && self.formatTokensList[self.currTokenAddr]) {
          balance = formatNumByDecimals(self.tokensBalance[self.currTokenAddr][item], self.formatTokensList[self.currTokenAddr].decimals)
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
}

const self = new Tokens();
export default self;
