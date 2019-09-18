import { observable, action, computed, runInAction, toJS } from 'mobx';
import axios from 'axios';

import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import { formatNum } from 'utils/support';

class Portfolio {
  @observable coinPriceArr;

  @observable coinList = ['WAN', 'ETH', 'BTC'];

  @action addCoin (newCoin) {
    if (self.coinList.indexOf(newCoin) === -1) {
      self.coinList.push(newCoin);
      return true
    }
    return false;
  }

  @action updateCoinPrice () {
    axios({
      method: 'GET',
      url: 'https://min-api.cryptocompare.com/data/pricemulti',
      params: {
        fsyms: self.coinList.join(),
        tsyms: 'USD'
      }
    }).then((res) => {
      if (res.status === 200) {
        runInAction(() => {
          self.coinPriceArr = res.data;
        })
      }
    })
  }

  @computed get portfolioList () {
    let list = self.coinList.map((item, index) => Object.defineProperties({}, {
      key: { value: `${index + 1}` },
      name: { value: item },
      price: { value: '$0', writable: true },
      balance: { value: '0', writable: true },
      value: { value: '0', writable: true },
      portfolio: { value: 0, writable: true }
    }));
    if (self.coinPriceArr) {
      let amountValue = 0;
      Object.keys(self.coinPriceArr).forEach(item => {
        list.forEach(val => {
          if (val.name === item) {
            switch (item) {
              case 'WAN':
                val.balance = wanAddress.getAllAmount;
                break;
              case 'ETH':
                val.balance = ethAddress.getAllAmount;
                break;
              case 'BTC':
                  val.balance = 0;
                  break;
            }
            val.price = `$${self.coinPriceArr[item]['USD']}`;
            val.value = '$' + (val.price.substr(1) * val.balance).toFixed(2);
            amountValue += parseFloat(val.value.substr(1));
          }
        });
      });
      Object.keys(self.coinPriceArr).forEach(item => {
        list.forEach(val => {
          if (val.name === item && amountValue !== 0) {
            val.portfolio = `${(val.value.substr(1) / amountValue * 100).toFixed(2)}%`;
          }
        });
      });
    }
    list.forEach(item => {
      item.price = `$${formatNum(item.price.substr(1))}`;
      item.balance = formatNum(item.balance);
      item.value = `$${formatNum(item.value.substr(1))}`
    })
    return list;
  }
}

const self = new Portfolio();
export default self;
