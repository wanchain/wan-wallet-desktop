import { observable, action, computed, runInAction, toJS } from 'mobx';
import axios from 'axios';
import { message } from 'antd';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import tokens from './tokens';

import { formatNum, formatNumByDecimals } from 'utils/support';
import { BigNumber } from 'bignumber.js';

class Portfolio {
  @observable coinPriceObj;

  @observable defaultCoinList = {
    WAN: {
      buddy: false,
      balance: 0,
    },
    ETH: {
      buddy: false,
      balance: 0,
    },
    BTC: {
      buddy: false,
      balance: 0,
    },
    EOS: {
      buddy: false,
      balance: 0,
    }
  };

  @observable specificTokenId_from_CoinGeckoAPI = {
    FNX: 'finnexus',
  }

  @observable tokenIds_from_CoinGeckoAPI = {}

  @observable coinList = Object.assign({}, this.defaultCoinList);

  @action setCoin() {
    self.coinList = Object.assign({}, self.defaultCoinList, self.getToken);
  }

  @computed get getToken() {
    let obj = {};
    tokens.tokensOnSideBar.forEach(item => {
      obj[item.tokenAddr] = {
        buddy: item.buddy,
        scAddr: item.tokenAddr,
        chain: item.chain,
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
        console.log('Get coin list from coingecko failed!');
      }
    })
    .catch((error) => {
      console.log('Get coin list from coingecko failed!', error);
      // message.warn('Get coin list failed, try to get coin list again automatically.');
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
        return item.buddy ? item.symbol.substring(1) : item.symbol;
      }
    });
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
        console.log('Get prices from coingecko failed.', res);
      }
    })
    .catch((error) => {
      console.log('Get prices from coingecko failed', error);
    });
  }

  @action updateTokenBalance() {
    Object.keys(self.coinList).forEach(async (key) => {
      let val = self.coinList[key];
      if (key in self.defaultCoinList) {
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
        }
      } else {
        let balances = await tokens.getTokenBalance(val);
        val.balance = Object.values(balances).reduce((total, cur) => {
          return new BigNumber(total).plus(cur).toString(10);
        });
        val.balance = formatNumByDecimals(val.balance, val.decimals);
      }
    });
  }

  @computed get portfolioList() {
    let list = Object.keys(self.coinList).map((key, index) => Object.defineProperties({}, {
      key: { value: `${index + 1}` },
      name: { value: key, writable: true },
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
          key = self.coinList[key].buddy ? self.coinList[key].symbol.substring(1) : self.coinList[key].symbol;
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
      item.name = Object.keys(self.defaultCoinList).includes(item.name) ? item.name : self.coinList[item.name].symbol;
      item.price = `$${formatNum(item.price.substr(1))}`;
      item.balance = formatNum(item.balance);
      item.value = `$${formatNum(item.value.substr(1))}`;
    });
    return list;
  }
}

const self = new Portfolio();
export default self;
