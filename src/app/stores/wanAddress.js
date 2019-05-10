
import { observable, action, computed } from 'mobx';
import { timeFormater, fromWei } from 'utils/support';

const WAN = "m/44'/5718350'/0'/0/";

class WanAddress {
    @observable addrInfo = {};
    @observable selectedAddr = '';
    @observable transHistory = {};

    @action addAddress(newAddr) {
      self.addrInfo[newAddr.address] = {
        name: `Account${newAddr.start + 1}`,
        balance: '0',
        path: newAddr.start
      };
    }

    @action updateTransHistory() {
      wand.request('transaction_showRecords', (err, val) => {
        if(!err && val.length !== 0) {
          val.forEach((item) => {
            self.transHistory[item.txHash] = item
          })
        }
      })
    }

    @action setSelectedAddr(addr) {
      self.selectedAddr = addr;
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
          balance: self.addrInfo[item].balance,
          path: `${WAN}${self.addrInfo[item].path}`,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get historyList() {
      let historyList = [];
      let addrList = self.selectedAddr ? [self.selectedAddr] : Object.keys(self.addrInfo);
      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          historyList.push({
            key: item,
            time: timeFormater(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: self.transHistory[item].status
          });
        }
      });
      return historyList;
    }

    @computed get getAmount() {
      return Object.keys(self.addrInfo).reduce((prev, curr) => prev + (self.addrInfo[curr].balance - 0), 0);
    }
}

const self = new WanAddress();
export default self;
