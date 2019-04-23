import { observable, action, computed, runInAction } from 'mobx';
import axios from 'axios';

class Portfolio {
  @observable coinPriceArr;
  @observable coinList = ['WAN', 'BTC', 'ETH'];

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
    let list = self.coinList.map((item, index) => {
      let obj = {};
      return Object.defineProperties(obj, {
        key: { value: `${ index + 1 }` },
        name: { value: item },
        price: { value: '$0', writable: true },
        balance: { value: '0' } ,
        value: { value: '0' },
        portfolio: { value: 0 }
      })
    })
    if(self.coinPriceArr) {
        Object.keys(self.coinPriceArr).forEach((item) => {
          list.forEach((val) =>{
            if(val.name === item) {
              val.price = `$${self.coinPriceArr[item]['USD']}`
            }
          })
        })
    }
    return list;
  }
}

const self = new Portfolio();
export default self;
