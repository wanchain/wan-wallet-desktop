
import { observable, action, computed } from 'mobx';

const WAN = "m/44'/5718350'/0'/0/";

class WanAddress {
    @observable addrInfo = {};

    @action addAddress(newAddr) {
      self.addrInfo[newAddr.wanaddr] = {
        name: `Account${newAddr.start + 1}`,
        balance: '0',
        path: newAddr.start
      };
    }

    @action updateBalance(arr) {
      let keys = Object.keys(arr);
      keys.forEach((item) => {
        if(self.addrInfo[item].balance !== arr[item]) {
          self.addrInfo[item].balance = arr[item]
        }
      })
    }

    @action updateName(arr) {
      const path = self.addrInfo[arr["address"]]["path"];

      wand.request('account_update', { walletID: 1, path: `${WAN}${path}`, meta: {name: arr.name, addr: arr.address} }, (err, val) => {
        if(!err && val) {
          self.addrInfo[arr["address"]]["name"] = arr.name;
        }
      })
    }

    @action getUserAccountFromDB() {
      wand.request('account_getAll', { chainID: 5718350 }, (err, ret) => {
        if (err) console.log('error printed inside callback: ', err)
        if(ret.accounts && Object.keys(ret.accounts).length) {
          let info = ret.accounts;
          Object.keys(info).forEach((item) => {
            self.addrInfo[info[item]['1']['addr']] = {
              name: info[item]['1']['name'],
              balance: 0,
              path: item.substr(item.lastIndexOf('\/')+1)
            }
          })
        }
      })
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
