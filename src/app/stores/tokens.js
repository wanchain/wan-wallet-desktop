import wanUtil from 'wanchain-util';
import BigNumber from 'bignumber.js';
import { observable, action, computed, toJS } from 'mobx';

import wanAddress from './wanAddress';
import { WANPATH } from 'utils/settings';
import { formatNum, formatNumByDeciamls } from 'utils/support';

class Tokens {
  @observable currTokenAddr = '';

  @observable tokensList = {};

  @observable tokensBalance = {};

  @action setCurrToken (addr) {
    self.currTokenAddr = addr;
  }

  @action getTokensInfo () {
    return new Promise((resolve, reject) => {
      wand.request('crosschain_getTokensInfo', null, (err, data) => {
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
    wand.request('crosschain_updateTokensBalance', { address: normalArr.concat(importArr), tokenScAddr }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.tokensBalance[tokenScAddr] = data;
    })
  }

  @action updateTokensInfo (addr, key, value) {
    wand.request('crosschain_updateTokensInfo', { addr, key, value }, (err) => {
      if (err) {
        console.log('crosschain_updateTokensInfo: ', err)
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
        wanAddr: item,
        symbol: val.tokenOrigAddr ? `W${val.symbol}` : val.symbol,
        select: val.select
      })
    })

    return list.sort((a, b) => b.wanAddr - a.wanAddr)
  }

  @computed get erc20TokensInfo () {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      list.push({
        ethAddr: self.tokensList[item].tokenOrigAddr,
        symbol: self.tokensList[item].symbol,
        decimals: self.tokensList[item].decimals
      })
    })

    return list.sort((a, b) => b.ethAddr - a.ethAddr)
  }

  @computed get tokensOnSideBar() {
    let list = [];
    Object.keys(self.tokensList).forEach(item => {
      if (self.tokensList[item].select) {
        list.push({
          tokenAddr: item,
          symbol: `W${self.tokensList[item].symbol}`
        })
      }
    });

    return list.sort((a, b) => b.wanAddr - a.wanAddr);
  }

  @computed get getTokensListInfo () {
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo['normal']);
    let importArr = Object.keys(wanAddress.addrInfo['import']);
    normalArr.concat(importArr).forEach((item, index) => {
      let balance;
      let type = normalArr.length - 1 < index ? 'import' : 'normal';
      if (self.tokensBalance && self.tokensBalance[self.currTokenAddr]) {
        if (self.tokensList && self.tokensList[self.currTokenAddr]) {
          balance = formatNumByDeciamls(self.tokensBalance[self.currTokenAddr][item], self.tokensList[self.currTokenAddr].decimals)
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

  @computed get getTokenAmount () {
    let amount = new BigNumber(0);
    self.getTokensListInfo.forEach(item => {
      amount = amount.plus(item.amount);
    })
    return formatNum(amount.toString());
  }
}

const self = new Tokens();
export default self;
