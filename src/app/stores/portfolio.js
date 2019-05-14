import { observable, action, computed, runInAction } from 'mobx';
import axios from 'axios';

import wanAddress from './wanAddress';

class Portfolio {
  @observable coinPriceArr;
  @observable coinList = ['WAN'];

  @action addCoin(newCoin) {
    if(self.coinList.indexOf(newCoin) === -1) {
      self.coinList.push(newCoin);
      return true
    }
    return false;
  }

  @action updateCoinPrice() {
    axios({
      method: 'GET',
      url: 'https://min-api.cryptocompare.com/data/pricemulti',
      params: {
        fsyms: self.coinList.join(),
        tsyms: 'USD'
      }
    }).then((res) => {
      if(res.status === 200) {
        runInAction(() => {
          self.coinPriceArr = res.data;
        })
      }
    })
  }

  @computed get portfolioList() {
    let list = self.coinList.map((item, index) => Object.defineProperties({}, {
      key: { value: `${ index + 1 }` },
      name: { value: item },
      price: { value: '$0', writable: true },
      balance: { value: '0', writable: true } ,
      value: { value: '0', writable: true },
      portfolio: { value: 0, writable: true }
    }));
    if(self.coinPriceArr) {
      let amountValue = 0;
      Object.keys(self.coinPriceArr).forEach((item) => {
        list.forEach((val) =>{
          if(val.name === item) {
            switch(item) {
              case 'WAN':
                val.balance = wanAddress.getAllAmount;
                break;
            }
            val.price = `$${self.coinPriceArr[item]['USD']}`;
            val.value = '$'+ (val.price.substr(1) * val.balance).toFixed(2);
            amountValue += parseFloat(val.value.substr(1));
          }
        });
      });
      Object.keys(self.coinPriceArr).forEach((item) => {
        list.forEach((val) =>{
          if(val.name === item && amountValue !== 0) {
            val.portfolio = `${ (val.value.substr(1) / amountValue * 100).toFixed(2) }%`;
          }
        });
      });
    }
    return list;
  }
}

const self = new Portfolio();
export default self;
