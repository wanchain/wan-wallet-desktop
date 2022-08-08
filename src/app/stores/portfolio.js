import { observable, action, computed, runInAction, makeObservable } from 'mobx';
import axios from 'axios';
import intl from 'react-intl-universal';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import xrpAddress from './xrpAddress';
import trxAddress from './trxAddress';
import tokens from './tokens';

import { formatNum, formatNumByDecimals } from 'utils/support';
import { BigNumber } from 'bignumber.js';
import { COIN_ACCOUNT, WALLET_CHAIN, COIN_ACCOUNT_EOS } from 'utils/settings';

class Portfolio {
  @observable coinPriceObj;

  defaultCoinList = {
    WAN: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.wanchain'),
    },
    ETH: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.ethereum'),
    },
    BTC: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.bitcoin'),
    },
    EOS: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.eos'),
    },
    XRP: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.xrpl'),
    },
    TRX: {
      ancestor: false,
      balance: 0,
      chain: intl.get('Common.tron'),
    }
  };

  @observable specificTokenId_from_CoinGeckoAPI = {
    FNX: 'finnexus',
  }

  @observable tokenIds_from_CoinGeckoAPI = {}

  @observable coinList = {};

  constructor() {
    makeObservable(this);
  }

  @action setCoin() {
    self.coinList = Object.assign({}, self.getToken);
  }

  @computed get getToken() {
    let obj = {};
    tokens.tokensOnSideBar.forEach(item => {
      obj[item.tokenAddr] = {
        ancestor: item.ancestor,
        scAddr: item.tokenAddr,
        chain: item.chain,
        chainSymbol: item.chainSymbol,
        symbol: item.symbol,
        decimals: item.decimals,
        balance: 0,
      }
    });
    return obj;
  }

  @action updateCoinsList_from_CoinGeckoAPI() {
    axios({
      method: 'GET',
      url: 'https://api.coingecko.com/api/v3/coins/list'
    })
      .then(res => {
        if (res.status === 200) {
          runInAction(() => {
            for (let obj of res.data) {
              this.tokenIds_from_CoinGeckoAPI[obj.symbol] = obj.id
            }
            this.updateCoinPrice();
          })
        } else {
          console.log('Get coin list failed!');
          setTimeout(() => {
            this.updateCoinsList_from_CoinGeckoAPI();
          }, 5000);
        }
      })
      .catch((error) => {
        console.log('Get coin list from coingecko failed!', error);
        setTimeout(() => {
          this.updateCoinsList_from_CoinGeckoAPI();
        }, 5000);
      });
  }

  @action updateCoinPrice() {
    let param = Object.keys(self.coinList).map(key => {
      let item = self.coinList[key];
      if (key in self.defaultCoinList) {
        return key
      } else {
        return item.ancestor ? item.ancestor : item.symbol;
      }
    });
    param = Array.from(new Set(param.concat(Object.keys(self.defaultCoinList))));
    let reconvertIds = {};
    for (let v of param) {
      if (v in self.specificTokenId_from_CoinGeckoAPI) {
        reconvertIds[self.specificTokenId_from_CoinGeckoAPI[v]] = v;
      } else if (v.toLowerCase() in self.tokenIds_from_CoinGeckoAPI) {
        reconvertIds[self.tokenIds_from_CoinGeckoAPI[v.toLowerCase()]] = v;
      }
    }
    let convertedParam = Object.keys(reconvertIds);
    if (convertedParam.length === 0) return;
    axios({
      method: 'GET',
      url: 'https://api.coingecko.com/api/v3/simple/price',
      params: {
        ids: convertedParam.join(),
        vs_currencies: 'usd',
      }
    })
      .then((res) => {
        if (res.status === 200) {
          runInAction(() => {
            self.coinPriceObj = {};
            for (let i in res.data) {
              self.coinPriceObj[reconvertIds[i]] = res.data[i].usd;
            }
          })
        } else {
          console.log('Get prices failed.', res);
        }
      })
      .catch((error) => {
        console.log('Get prices from coingecko failed', error);
      });
  }

  @action updateTokenBalance() {
    try {
      Object.keys(self.coinList).forEach(async (key) => {
        let val = self.coinList[key];
        if (key.indexOf(COIN_ACCOUNT) !== -1 || key.indexOf(COIN_ACCOUNT_EOS) !== -1) {
          key = val.symbol;
        }
        if (WALLET_CHAIN.includes(key)) {
          switch (key) {
            case 'WAN':
              val.balance = wanAddress.getAllAmount;
              break;
            case 'ETH':
              val.balance = ethAddress.getAllAmount;
              break;
            case 'BTC':
              val.balance = btcAddress.getAllAmount;
              break;
            case 'EOS':
              val.balance = eosAddress.getAllAmount;
              break;
            case 'XRP':
              val.balance = xrpAddress.getAllAmount;
              break;
            case 'TRX':
              val.balance = trxAddress.getAllAmount;
              break;
          }
        } else {
          let balances = await tokens.getTokenBalance(val);
          if (Object.keys(balances).length === 0) {
            val.balance = 0;
          } else {
            val.balance = Object.values(balances).reduce((total, cur) => {
              return new BigNumber(total).plus(cur).toString(10);
            });
            val.balance = formatNumByDecimals(val.balance, val.decimals);
          }
        }
      });
    } catch (e) {
      console.log(e)
    }
  }

  @computed get portfolioList() {
    let list = Object.keys(self.coinList).map((key, index) => Object.defineProperties({}, {
      key: { value: `${index + 1}` },
      name: { value: key, writable: true },
      chain: { value: self.coinList[key].chain, writable: true },
      price: { value: '$0', writable: true },
      balance: { value: self.coinList[key].balance ? self.coinList[key].balance : '0', writable: true }, // To do
      value: { value: '$0', writable: true },
      portfolio: { value: '0%', writable: true },
      scAddr: { value: self.coinList[key].scAddr, writable: true },
    }));
    if (self.coinPriceObj) {
      let amountValue = 0;
      Object.keys(self.coinList).forEach((key, index) => {
        let val = list[index];
        if (!(key in self.defaultCoinList)) {
          if (key.indexOf(COIN_ACCOUNT) !== -1) {
            key = self.coinList[key].symbol;
          } else {
            key = self.coinList[key].ancestor ? self.coinList[key].ancestor : self.coinList[key].symbol;
          }
        }
        if (key in self.coinPriceObj) {
          val.price = `$${self.coinPriceObj[key]}`;
          val.value = '$' + (new BigNumber(val.price.substr(1)).times(new BigNumber(val.balance))).toFixed(2).toString(10);
          amountValue = new BigNumber(amountValue).plus(new BigNumber(val.value.substr(1))).toString(10);
        }
      });
      if (!new BigNumber(amountValue).isEqualTo(0)) {
        list.forEach(val => {
          if (val.value.substr(1) === '0') {
            val.portfolio = '0%';
          } else {
            let num = new BigNumber(val.value.substr(1)).div(new BigNumber(amountValue)).times(100);
            val.portfolio = num.lt(0.01) ? '0%' : `${num.toFixed(2).toString(10)}%`;
          }
        });
      }
    }
    list.sort((m, n) => {
      if (new BigNumber(m.value.replace(/\$/g, '')).lt(n.value.replace(/\$/g, ''))) {
        return 1;
      } else if (new BigNumber(m.value.replace(/\$/g, '')).eq(n.value.replace(/\$/g, ''))) {
        if (new BigNumber(m.balance).lt(n.balance)) {
          return 1;
        } else {
          return -1;
        }
      } else {
        return -1;
      }
    });
    list.forEach(item => {
      item.name = self.coinList[item.name].symbol;
      item.price = `$${formatNum(item.price.substr(1))}`;
      item.balance = formatNum(item.balance);
      item.value = `$${formatNum(item.value.substr(1))}`;
    });
    return list;
  }
}

const self = new Portfolio();
export default self;
