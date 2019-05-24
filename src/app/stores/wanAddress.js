
import { observable, action, computed } from 'mobx';
import { timeFormat, fromWei } from 'utils/support';
import wanUtil from "wanchain-util";
import intl from 'react-intl-universal';

import session from './session';

const WAN = "m/44'/5718350'/0'/0/";
const KEYSTOREID = 5;

class WanAddress {
    @observable addrInfo = {
      'normal': {},
      'ledger': {},
      'trezor': {},
      'import': {},
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
            address: addr.address,
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
      let importArr = Object.keys(self.addrInfo['import']);

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
        if(importArr.includes(item) && self.addrInfo['import'][item].balance !== arr[item]) {
          self.addrInfo['import'][item].balance = arr[item];
        }
      })
    }

    @action updateName(arr) {
      let walletID, type;
      if(Object.keys(self.addrInfo['normal']).includes(arr.address)) {
        walletID = 1;
        type = 'normal';
      } else {
        walletID = KEYSTOREID;
        type = 'import';
      };
      wand.request('account_update', { walletID, path: arr.path, meta: {name: arr.name, addr: arr.address.toLowerCase()} }, (err, val) => {
        if(!err && val) {
          self.addrInfo[type][arr['address']]['name'] = arr.name;
        }
      })
    }

    @action getUserAccountFromDB() {
      wand.request('account_getAll', { chainID: 5718350 }, (err, ret) => {
        if (err) console.log('Get user from DB failed ', err)
        if(ret.accounts && Object.keys(ret.accounts).length) {
          let info = ret.accounts;
          let typeFunc = id => id === '1' ? 'normal': 'import';
          Object.keys(info).forEach(val => {
            Object.keys(info[val]).forEach(item => {
              let address = info[val][item]['addr'];
              self.addrInfo[typeFunc(item)][wanUtil.toChecksumAddress(address)] = {
                name: info[val][item]['name'],
                balance: 0,
                path: item.substr(val.lastIndexOf('\/')+1)
              }
            })
          })
        }
      })
    }

    @action addKeyStoreAddr({path, addr}) {
      self.addrInfo['import'][`0x${addr}`] = {
        name: `Imported${path + 1}`,
        balance: '0',
        path: path
      };
    }

    @computed get currentPage() {
      let page = '';
      switch (session.pageTitle) {
        case intl.get('Ledger.ledger'):
          page = 'ledger';
          break;
        case intl.get('Trezor.trezor'):
          page = 'trezor';
          break;
        case intl.get('WanAccount.wallet'):
          page = 'normal';
          break;
      }
      return page;
    }

    @computed get getAddrList() {
      let addrList = [];
      let normalArr = Object.keys(self.addrInfo['normal']);
      let importArr = Object.keys(self.addrInfo['import']);
      normalArr.concat(importArr).forEach((item, index) => {
        let type = normalArr.length -1 < index ? 'import' : 'normal';
        addrList.push({
          key: item,
          name: self.addrInfo[type][item].name,
          address: wanUtil.toChecksumAddress(item),
          balance: self.addrInfo[type][item].balance,
          path: `${WAN}${self.addrInfo[type][item].path}`,
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
      let sum = 0;
      Object.values({normal: self.addrInfo.normal, import: self.addrInfo.import}).forEach(value => sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0));
      return sum;
    }

    @computed get getAllAmount() {
      let sum = 0;
      Object.values(self.addrInfo).forEach(value => sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0));
      return sum;
    }
}

const self = new WanAddress();
export default self;
