
import { observable, action, computed } from 'mobx';
import { timeFormat, fromWei } from 'utils/support';
import wanUtil from "wanchain-util";

import session from './session';

const WAN = "m/44'/5718350'/0'/0/";

class WanAddress {
    @observable addrInfo = {
      'normal': {},
      'ledger': {},
      'trezor': {},
    };
    @observable selectedAddr = '';
    @observable transHistory = {};

    @action addAddress(newAddr) {
      self.addrInfo['normal'][newAddr.address] = {
        name: `Account${newAddr.start + 1}`,
        balance: '0',
        path: newAddr.start
      };
    }

    @action updateAddress(type, newAddress = {}) {
      self.addrInfo[type] = newAddress;
    }

    @action addAddresses(type, addrArr) {
      addrArr.forEach(addr => {
        if(!Object.keys(self.addrInfo[type]).includes(addr.address)) {
          self.addrInfo[type][addr.address] = {
            name: `Account${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`,
            balance: addr.balance || '0',
            address: addr.balance,
            path: addr.path
          }
        }
      })
    }

    @action updateTransHistory() {
      wand.request('transaction_showRecords', (err, val) => {
        if(!err && val.length !== 0) {
          val.forEach(item => {
            item.from = wanUtil.toChecksumAddress(item.from);
            if(item.txHash !== item.hashX) {
              self.transHistory[item.txHash] = item;
            }
          })
        }
      })
    }

    @action setSelectedAddr(addr) {
      self.selectedAddr = addr;
    }

    @action updateWANBalance(arr) {
      let keys = Object.keys(arr);
      let normal = Object.keys(self.addrInfo['normal']); 
      let ledger = Object.keys(self.addrInfo['ledger']); 
      let trezor = Object.keys(self.addrInfo['trezor']); 
      keys.forEach(item => {
        if(normal.includes(item) && self.addrInfo['normal'][item].balance !== arr[item]) {
          self.addrInfo['normal'][item].balance = arr[item];
        }
        if(ledger.includes(item) && self.addrInfo['ledger'][item].balance !== arr[item]) {
          self.addrInfo['ledger'][item].balance = arr[item];
        }
        if(trezor.includes(item) && self.addrInfo['trezor'][item].balance !== arr[item]) {
          self.addrInfo['trezor'][item].balance = arr[item];
        }
      })
    }

    @action updateName(arr) {
      const path = self.addrInfo['normal'][arr['address']]['path'];

      wand.request('account_update', { walletID: 1, path: `${WAN}${path}`, meta: {name: arr.name, addr: arr.address.toLowerCase()} }, (err, val) => {
        if(!err && val) {
          self.addrInfo['normal'][arr['address']]['name'] = arr.name;
        }
      })
    }

    @action getUserAccountFromDB() {
      wand.request('account_getAll', { chainID: 5718350 }, (err, ret) => {
        if (err) console.log('Get user from DB failed ', err)
        if(ret.accounts && Object.keys(ret.accounts).length) {
          let info = ret.accounts;
          Object.keys(info).forEach((item) => {
            let address = info[item]['1']['addr']
            self.addrInfo['normal'][wanUtil.toChecksumAddress(address)] = {
              name: info[item]['1']['name'],
              balance: 0,
              path: item.substr(item.lastIndexOf('\/')+1)
            }
          })
        }
      })
    }

    @computed get currentPage() {
      let page = '';
      switch (session.pageTitle) {
        case 'Ledger':
          page = 'ledger';
          break;
        case 'Trezor':
          page = 'trezor';
          break;
        case 'Wallet':
          page = 'normal';
          break;
      }
      return page;
    }

    @computed get getAddrList() {
      let addrList = [];
      Object.keys(self.addrInfo['normal']).forEach((item, index) => {
        addrList.push({
          key: item,
          name: self.addrInfo['normal'][item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: self.addrInfo['normal'][item].balance,
          path: `${WAN}${self.addrInfo['normal'][item].path}`,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get ledgerAddrList() {
      let addrList = [];
      let type = 'ledger';
      Object.keys(self.addrInfo[type]).forEach((item, index) => {
        addrList.push({
          key: item,
          name: self.addrInfo[type][item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: self.addrInfo[type][item].balance,
          path: self.addrInfo[type][item].path,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get trezorAddrList() {
      let addrList = [];
      let type = 'trezor';
      Object.keys(self.addrInfo[type]).forEach((item, index) => {
        addrList.push({
          key: item,
          name: self.addrInfo[type][item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: self.addrInfo[type][item].balance,
          path: self.addrInfo[type][item].path,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get historyList() {
      let historyList = [], page = self.currentPage;
      let addrList = self.selectedAddr ? [self.selectedAddr] : Object.keys(self.addrInfo[page]);

      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          let status = self.transHistory[item].status;
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[page][self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: ['Failed', 'Success'].includes(status) ? status : 'Pending',
            sendTime: self.transHistory[item]["sendTime"],
          });
        }
      });
      return historyList.sort((a, b) => b.sendTime - a.sendTime);
    }

    @computed get getNormalAmount() {
      return Object.keys(self.addrInfo['normal']).reduce((prev, curr) => prev + (self.addrInfo['normal'][curr].balance - 0), 0);
    }

    @computed get getAllAmount() {
      let ledger = Object.keys(self.addrInfo['ledger']).reduce((prev, curr) => prev + (self.addrInfo['ledger'][curr].balance - 0), 0);
      let trezor = Object.keys(self.addrInfo['trezor']).reduce((prev, curr) => prev + (self.addrInfo['trezor'][curr].balance - 0), 0);

      return self.getNormalAmount + ledger + trezor;
    }
}

const self = new WanAddress();
export default self;
