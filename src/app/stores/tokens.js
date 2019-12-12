import wanUtil from 'wanchain-util';
import BigNumber from 'bignumber.js';
import { observable, action, computed, toJS } from 'mobx';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import { WANPATH, ETHPATH, WALLET_CHAIN } from 'utils/settings';
import { formatNum, formatNumByDecimals } from 'utils/support';

class Tokens {
  @observable currTokenAddr = '';

  @observable tokensList = {};

  @observable tokensBalance = {};

  @observable E20TokensBalance = {};

  @action setCurrToken (addr, symbol) {
    if (symbol) {
      addr = Object.keys(self.tokensList).find(item => self.tokensList[item].symbol === symbol)
    }
    self.currTokenAddr = addr;
  }

  @action getRegTokensInfo () {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getRegTokensInfo', null, (err, data) => {
        if (err) {
          console.log('getWrcTokensInfo: ', err);
          reject(err)
          return;
        }
        self.tokensList = data;
        resolve()
      })
    })
  }

  @action addCustomToken (tokenInfo) {
    let { tokenAddr } = tokenInfo;
    self.tokensList[tokenAddr.toLowerCase()] = {
      select: false,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals
    }
  }

  @action updateTokensBalance (tokenScAddr) {
    let normalArr = Object.keys(wanAddress.addrInfo['normal']);
    let importArr = Object.keys(wanAddress.addrInfo['import']);
    wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr), tokenScAddr, chain: 'WAN' }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.tokensBalance[tokenScAddr] = data;
    })
  }

  @action updateE20TokensBalance (tokenScAddr) {
    let normalArr = Object.keys(ethAddress.addrInfo['normal']);
    wand.request('crossChain_updateTokensBalance', { address: normalArr, tokenScAddr, chain: 'ETH' }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.E20TokensBalance[tokenScAddr] = data;
    })
  }

  @action updateTokensInfo (addr, key, value) {
    wand.request('crossChain_updateTokensInfo', { addr, key, value }, (err) => {
      if (err) {
        console.log('crossChain_updateTokensInfo: ', err)
        return;
      }
      self.tokensList[addr][key] = value;
      // self.tokensList[addr] = Object.assign({}, self.tokensList[addr], { [key]: value });
    })
  }

  @action addWrc20Tokens (scInfo) {
    const { addr } = scInfo;
    if (addr) {
      self.wrc20List.addr = { ...scInfo };
    }
  }

  @computed get wrc20TokensInfo () {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      let val = self.tokensList[item];
      list.push({
        addr: item,
        symbol: !val.userAdrr ? `W${val.symbol}` : val.symbol,
        select: val.select
      })
    })
    return list.sort((a, b) => a.symbol.substr(1).codePointAt() - b.symbol.substr(1).codePointAt())
  }

  @computed get erc20TokensInfo () {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      let val = self.tokensList[item];
      if (!WALLET_CHAIN.includes(val.symbol) && !val.userAdrr) {
        list.push({
          addr: item,
          symbol: val.symbol,
          select: val.erc20Select,
          erc20Addr: val.tokenOrigAddr
        })
      }
    })
    return list.sort((a, b) => a.symbol.codePointAt() - b.symbol.codePointAt())
  }

  @computed get tokensOnSideBar() {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      if (self.tokensList[item].select) {
        list.push({
          tokenAddr: item,
          tokenOrigAddr: self.tokensList[item].tokenOrigAddr || '',
          symbol: !self.tokensList[item].userAddr ? `W${self.tokensList[item].symbol}` : self.tokensList[item].symbol
        })
      }
    });
    return list.sort((a, b) => a.symbol.substr(1).codePointAt() - b.symbol.substr(1).codePointAt())
  }

  @computed get e20TokensOnSideBar() {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      if (self.tokensList[item].erc20Select) {
        list.push({
          tokenAddr: self.tokensList[item].tokenOrigAddr,
          tokenWanAddr: item || '',
          symbol: self.tokensList[item].symbol
        })
      }
    });
    return list.sort((a, b) => a.symbol.codePointAt() - b.symbol.codePointAt());
  }

  @computed get getTokensListInfo () {
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo['normal']);
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

  @computed get getTokensListInfo_2WanTypes () {
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo['normal']);
    let importArr = Object.keys(wanAddress.addrInfo['import']);
    normalArr.concat(importArr).forEach((item, index) => {
      let balance;
      let type = normalArr.length - 1 < index ? 'import' : 'normal';
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

  @computed get getE20TokensListInfo () {
    let addrList = [];
    let normalArr = Object.keys(ethAddress.addrInfo.normal);
    normalArr.forEach(item => {
      let balance;
      if (self.tokensList && self.tokensList[self.currTokenAddr]) {
        let tokenOrigAddr = self.tokensList[self.currTokenAddr].tokenOrigAddr;

        if (self.E20TokensBalance && self.E20TokensBalance[tokenOrigAddr]) {
          balance = formatNumByDecimals(self.E20TokensBalance[tokenOrigAddr][item], self.tokensList[self.currTokenAddr].decimals)
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

  @computed get getTokenAmount () {
    let amount = new BigNumber(0);
    let importArr = Object.keys(wanAddress.addrInfo['import']);

    self.getTokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    });
    importArr.forEach(item => {
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

  @computed get getE20TokenAmount () {
    let amount = new BigNumber(0);

    self.getE20TokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    });

    return formatNum(amount.toString(10));
  }
}

const self = new Tokens();
export default self;
