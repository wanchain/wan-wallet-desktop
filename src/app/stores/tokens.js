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
import { formatNum, formatNumByDecimals, formatTokensList } from 'utils/support';
import { WANPATH, ETHPATH, WALLET_CHAIN, CROSSCHAINTYPE } from 'utils/settings';
import { getBalance } from 'utils/helper';

class Tokens {
  @observable currTokenAddr = '';

  @observable coinsList = {}; // Original coins collection

  @observable tokensList = {}; // Tokens collection

  @observable ccTokensList = {};

  @observable tokensBalance = {};

  @observable E20TokensBalance = {}; // Included in tokensBalance

  @observable tokenIconList = {};

  @observable walletSelections = {};

  @action updateWalletSelectedStatus(symbol, selected) {
    wand.request('crossChain_updateCoinsInfo', { symbol, key: 'select', value: selected }, (err, data) => {
      if (err) {
        console.log('updateCoinsInfo failed:', err);
      } else {
        this.coinsList[symbol].select = selected;
      }
    });
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

  @action setCurrToken(addr, symbol) {
    if (symbol) {
      addr = Object.keys(self.formatTokensList).find(item => self.formatTokensList[item].symbol === symbol)
    }
    self.currTokenAddr = addr;
  }

  @action getToken(scAddr) {
    let token = self.tokensList[scAddr];
    if (token && token.buddy && self.tokensList[token.buddy]) {
      token.iconData = self.tokensList[token.buddy].iconData;
      token.iconType = self.tokensList[token.buddy].iconType;
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

  @action getCoinsInfo() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getCoinsInfo', {}, (err, data) => {
        if (err) {
          console.log('getCoinsInfo: ', err);
          reject(err)
          return;
        }
        self.coinsList = data;
        resolve()
      })
    })
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
    const ADDRESSES = { ethAddress, btcAddress, eosAddress, wanAddress };
    if (ADDRESSES[`${chain.toLowerCase()}Address`] === undefined) {
      console.log('Cannot get addresses.');
      return;
    }
    let addrInfo = ADDRESSES[`${chain.toLowerCase()}Address`].addrInfo;
    let normalArr = Object.keys(addrInfo.normal || []);
    let importArr = Object.keys(addrInfo.import || []);
    let ledgerArr = Object.keys(addrInfo.ledger || []);
    let trezorArr = Object.keys(addrInfo.trezor || []);
    let rawKeyArr = Object.keys(addrInfo.rawKey || []);
    wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr, ledgerArr, trezorArr, rawKeyArr), tokenScAddr, chain }, (err, data) => {
      if (err) {
        console.log('stores_getTokensBalance:', err);
        return;
      }
      self.tokensBalance[tokenScAddr] = data;
    })
  }

  /* @action updateCoinsBalance(chain = 'WAN') {
    const ADDRESSES = { ethAddress, btcAddress, eosAddress, wanAddress };
    if (ADDRESSES[`${chain.toLowerCase()}Address`] === undefined) {
      console.log('Cannot get addresses.');
      return;
    }
    let addrInfo = ADDRESSES[`${chain.toLowerCase()}Address`].addrInfo;
    let normalArr = Object.keys(addrInfo.normal || []);
    let importArr = Object.keys(addrInfo.import || []);
    let ledgerArr = Object.keys(addrInfo.ledger || []);
    let trezorArr = Object.keys(addrInfo.trezor || []);
    let rawKeyArr = Object.keys(addrInfo.rawKey || []);
    let addresses = normalArr.concat(importArr, ledgerArr, trezorArr, rawKeyArr);

    getBalance(addresses, chain).then(res => {
      if (res && Object.keys(res).length) {
        ADDRESSES[`${chain.toLowerCase()}Address`][`update${chain}Balance`](res);
      }
    }).catch(err => {
      console.log('Get coins\' balance failed:', err);
    })
  } */

  getCoinsListInfo_2way(chain, chainID) {
    const ADDRESSES = { ethAddress, btcAddress, eosAddress, wanAddress };
    let addressObj = ADDRESSES[`${chain.toLowerCase()}Address`];
    if (addressObj === undefined) {
      return [];
    }
    let addrList = [];
    let normal = addressObj.addrInfo.normal || [];
    let ledger = addressObj.addrInfo.ledger || [];
    let trezor = addressObj.addrInfo.trezor || [];
    let addresses = Object.assign({}, normal, ledger, trezor);
    // console.log('getCoinsListInfo_2way-------------------addresses:', addresses)
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
    const ADDRESSES = { ethAddress, btcAddress, eosAddress, wanAddress };
    let addrList = [];
    let addresses = ADDRESSES[`${chain.toLowerCase()}Address`];
    if (addresses === undefined) {
      return [];
    }
    let normal = addresses.addrInfo.normal;
    // console.log('tokensBalance:', self.tokensBalance);
    Object.keys(normal).forEach(item => {
      let balance;
      if (self.tokensBalance && self.tokensBalance[SCAddress]) {
        if (self.tokensList && self.tokensList[SCAddress]) {
          balance = formatNumByDecimals(self.tokensBalance[SCAddress][item], self.tokensList[SCAddress].decimals)
        } else {
          balance = 0
        }
      } else {
        balance = 0;
      }

      addrList.push({
        key: item,
        name: normal[item].name,
        address: wanUtil.toChecksumAddress(item),
        balance: formatNum(balance),
        path: `m/44'/${Number(chainID) - Number('0x80000000'.toString(10))}'/0'/0/${normal[item].path}`,
        action: 'send',
        amount: balance
      });
    });
    return addrList;
  }

  @action getTokenBalance(item) {
    const { chain, scAddr } = item;
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

      wand.request('crossChain_updateTokensBalance', { address: normalArr.concat(importArr).concat(ledgerArr).concat(trezorArr).concat(rawKeyArr), tokenScAddr: scAddr, chain: chain }, (err, data) => {
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

  @action updateCoinsList(symbol, value) {
    wand.request('crossChain_updateCoinsInfo', { symbol, key: undefined, value }, (err) => {
      if (err) {
        console.log('crossChain_updateCoinsInfo: ', err);
      } else {
        this.coinsList[symbol] = value;
      }
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

  @action updateCoinsInfo(symbol, key, value) {
    wand.request('crossChain_updateCoinsInfo', { symbol, key, value }, (err) => {
      if (err) {
        console.log('crossChain_updateCoinsInfo: ', err)
        return;
      }
      self.coinsList[symbol][key] = value;
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
        buddy: val.buddy,
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
          buddy: val.buddy,
          decimals: val.decimals,
        })
      }
    });
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  @computed get getTokensListInfo() {
    let addrList = [];
    let normalArr = Object.keys(wanAddress.addrInfo.normal);
    // console.log('normalArr:', normalArr);
    // console.log('tokensBalance', self.tokensBalance);
    // console.log('tokensList', self.tokensList);
    // console.log('currTokenAddr', self.currTokenAddr);
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

  @computed get getTokensListInfo_2WanTypes() {
    let addTypes = ['normal', 'ledger', 'trezor', 'import', 'rawKey'];
    let addrList = [];

    Object.keys(wanAddress.addrInfo).forEach(type => {
      if (!addTypes.includes(type)) {
        return;
      }

      Object.keys(wanAddress.addrInfo[type]).forEach(item => {
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
        let path = ['ledger', 'trezor'].includes(type) ? `${wanAddress.addrInfo[type][item].path}` : `${WANPATH}${wanAddress.addrInfo[type][item].path}`;
        addrList.push({
          path,
          key: item,
          name: wanAddress.addrInfo[type][item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: balance,
          action: 'send',
          amount: balance
        });
      })
    })

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
    Object.keys(this.coinsList).forEach(key => {
      let v = this.coinsList[key];
      if (!selections[key]) {
        selections[key] = {
          symbol: v.symbol,
          key: v.symbol,
          children: []
        };
      }
      selections[key].children.push({
        title: v.chain,
        symbol: v.symbol,
        name: v.name,
        key: `/${v.symbol.toLowerCase()}Account`,
        selected: v.select,
        isToken: false,
      });
    });

    Object.keys(this.tokensList).forEach(key => {
      let v = this.tokensList[key];
      if (!selections[v.symbol]) {
        selections[v.symbol] = {
          symbol: v.symbol,
          key: v.symbol,
          children: []
        };
      }
      selections[v.symbol].children.push({
        title: v.chain,
        symbol: v.symbol,
        name: v.name,
        key: `/tokens/${v.chain}/${key}/${v.symbol}`,
        tokenAddress: key,
        selected: v.select,
        isToken: true,
      });
    });
    return Object.values(selections);
  }
}

const self = new Tokens();
export default self;
