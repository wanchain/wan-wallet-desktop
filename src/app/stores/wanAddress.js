
import { observable, action, computed } from 'mobx';
import { remote } from 'electron';

import { getBalanceObj } from 'utils/support';

const { getUserAccountFromDB } = remote.require('./controllers');

class WanAddress {
    @observable addrInfo = {};
    @observable amount = 0;

    @action addAddress(newAddr) {
      console.log(newAddr)
      self.addrInfo[newAddr.wanaddr] = {
        name: `Account${newAddr.start + 1}`,
        balance: `${newAddr.balance}`,
        path: newAddr.start
      };
    }

    @action updateBalance(arr) {
      let balaObj = getBalanceObj(arr);
      let keys = Object.keys(balaObj);
      keys.forEach((item) => {
        if(self.addrInfo[item].balance !== balaObj[item]) {
          self.addrInfo[item].balance = balaObj[item]
        }
      })
    }

    @action getUserAccountFromDB() {
      let ret = getUserAccountFromDB();
      if(ret.code && Object.keys(ret.result).length) {
        let info = ret.result.accounts;
        Object.keys(info).forEach((item) => {
          self.addrInfo[info[item]['1']['addr']] = {
            name: info[item]['1']['name'],
            balance: 0,
            path: item.substr(item.lastIndexOf('\/')+1)
          }
        })
      }
    }

    @computed get getAddrList() {
      let addrList = [];
      Object.keys(self.addrInfo).forEach((item, index) => {
        addrList.push({
          key: `${index + 1}`,
          name: self.addrInfo[item].name,
          address: item,
          balance: self.addrInfo[item].balance
        });
      });
      return addrList;
    }

    @computed get getAmount() {
      return Object.keys(self.addrInfo).reduce((prev, curr) => prev + (self.addrInfo[curr].balance - 0), 0);
    }
}

const self = new WanAddress();
export default self;
