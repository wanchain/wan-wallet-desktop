import { observable, action, computed, runInAction, toJS } from 'mobx';
import axios from 'axios';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import btcAddress from './btcAddress';
import eosAddress from './eosAddress';
import tokens from './tokens';

import { formatNum, formatNumByDecimals } from 'utils/support';
import { BigNumber } from 'bignumber.js';

class Portfolio {
  @observable coinPriceArr;

  // @observable defaultCoinList = ['WAN', 'ETH', 'BTC', 'EOS'];

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

  @observable coinList = Object.assign({}, this.defaultCoinList);

  /* @computed get coinList() {
    return Object.assign({}, self.getToken, self.defaultCoinList);
  } */

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

  @action updateCoinPrice() {
    let param = Object.keys(self.coinList).map(key => {
      let item = self.coinList[key];
      if (key in self.defaultCoinList) {
        return key
      } else {
        return item.buddy ? item.symbol.substring(1) : item.symbol;
      }
    });
    axios({
      method: 'GET',
      url: 'https://min-api.cryptocompare.com/data/pricemulti',
      params: {
        fsyms: param.join(),
        tsyms: 'USD'
      }
    }).then((res) => {
      console.log('<<<<<<<<<<< coin prices >>>>>>>>>>', res.data);
      if (res.status === 200 && res.data.Response !== 'Error') {
        runInAction(() => {
          self.coinPriceArr = res.data;
        })
      } else {
        console.log('Get prices failed!');
      }
    })
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
        // val.balance = formatNumByDecimals(new BigNumber(Math.random()).times(1E21).toString(), val.decimals);// To delete
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
      portfolio: { value: '0%', writable: true }
    }));
    if (self.coinPriceArr) {
      let amountValue = 0;
      Object.keys(self.coinList).forEach((key, index) => {
        let val = list[index];
        if (!(key in self.defaultCoinList)) {
          key = self.coinList[key].buddy ? self.coinList[key].symbol.substring(1) : self.coinList[key].symbol;
        }
        if (self.coinPriceArr[key]) {
          val.price = `$${self.coinPriceArr[key]['USD']}`;
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
          // val.portfolio = val.value.substr(1) === '0' ? '0%' : `${(new BigNumber(val.value.substr(1)).div(new BigNumber(amountValue)).times(100)).toFixed(2).toString(10)}%`;
        });
      }
    }
    list.sort((m, n) => {
      return new BigNumber(m.value.replace(/\$/g, '')).lt(n.value.replace(/\$/g, '')) ? 1 : -1;
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
