
import wanUtil from "wanchain-util";
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';

import staking from './staking';
import languageIntl from './languageIntl';
import { checkAddrType } from 'utils/helper';
import { timeFormat, fromWei } from 'utils/support';
import validatorImg from 'static/image/validator.png';

const KEYSTOREID = 5;
const WAN = "m/44'/5718350'/0'/0/";

class WanAddress {
    @observable addrInfo = {
      'normal': {},
      'ledger': {},
      'trezor': {},
      'import': {},
    };
    @observable currentPage = [];    
    @observable selectedAddr = '';
    @observable transHistory = {};

    @action addAddress(newAddr) {
      self.addrInfo['normal'][newAddr.address] = {
        name: `Account${newAddr.start + 1}`,
        address: newAddr.address,
        balance: '0',
        path: newAddr.start
      };
    }

    @action updateAddress(type, newAddress = {}) {
      if(typeof type === 'string') {
        self.addrInfo[type] = newAddress;
      } else {
        type.forEach(item => self.addrInfo[item] = newAddress)
      }
    }

    @action addAddresses(type, addrArr) {
      addrArr.forEach(addr => {
        if(!Object.keys(self.addrInfo[type]).includes(addr.address)) {
          if(addr.name === undefined && type === 'ledger') {
            addr.name = `Ledger${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
          }
          if(addr.name === undefined) {
            addr.name = `Account${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
          }
          self.addrInfo[type][addr.address] = {
            name: addr.name,
            balance: addr.balance || '0',
            address: addr.address,
            path: addr.path
          }
        }
      })
    }

    @action updateTransHistory(initialize = false) {
      if(initialize) {
        self.transHistory = {};
      }
      wand.request('transaction_showRecords', (err, val) => {
        if(!err && val.length !== 0) {
          val.forEach(item => {
            item.from = wanUtil.toChecksumAddress(item.from);
            if(item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
              self.transHistory[item.txHash] = item;
            }
            if(item.txHash === '' && item.status === 'Failed') {
              self.transHistory[item.hashX] = item;
            }
          })
        }
      })
    }

    @action setSelectedAddr(addr) {
      if(typeof addr === 'string') {
        self.selectedAddr = [addr];
      } else {
        self.selectedAddr = addr;
      }
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

    @action updateName(arr, chainType) {
      let walletID, type, index;
      switch(chainType) {
        case 'normal':
          if(Object.keys(self.addrInfo['normal']).includes(arr.address)) {
            walletID = 1;
            type = 'normal';
          } else {
            walletID = KEYSTOREID;
            type = 'import';
          };
          break;

        case 'ledger':
          walletID = 2;
          type = 'ledger';
          index =  arr.path.lastIndexOf('\/') + 1
          arr.path = `${arr.path.slice(0, index)}0/${arr.path.slice(index)}`;
          break;

        case 'trezor':
          walletID = 3;
          type = 'trezor';
          break;
      }
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
          Object.keys(info).forEach(path => {
            Object.keys(info[path]).forEach(id => {
              if(['1', '5'].includes(id)) {
                let address = info[path][id]['addr'];
                self.addrInfo[typeFunc(id)][wanUtil.toChecksumAddress(address.toLowerCase())] = {
                  name: info[path][id]['name'],
                  balance: 0,
                  path: path.substr(path.lastIndexOf('\/')+1),
                  address: wanUtil.toChecksumAddress(address.toLowerCase())
                }
              }
            })
          })
        }
      })
    }

    @action addKeyStoreAddr({path, addr}) {
      self.addrInfo['import'][wanUtil.toChecksumAddress(`0x${addr}`)] = {
        name: `Imported${path + 1}`,
        balance: '0',
        path: path,
        address: wanUtil.toChecksumAddress(`0x${addr}`)
      };
    }

    @action setCurrPage(page) {
      self.currentPage = page;
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

    @computed get getNormalAddrList() {
      let addrList = [];
      let normalArr = Object.keys(self.addrInfo['normal']);
      normalArr.forEach((item, index) => {
        let type = 'normal';
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
      let addrList = [];
      if(self.selectedAddr) {
        addrList = self.selectedAddr
      } else {
        page.forEach(name => {
          addrList = addrList.concat(Object.keys(self.addrInfo[name]))
        })
      }
      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          let status = self.transHistory[item].status;
          let type = checkAddrType(self.transHistory[item]["from"], self.addrInfo)
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[type][self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]["sendTime"],
          });
        }
      });
      return historyList.sort((a, b) => b.sendTime - a.sendTime);
    }

    //TODO: need add hd
    @computed get stakingHistoryList() {
      let historyList = [], page = 'normal';//self.currentPage; 

      let addrList = Object.keys(self.addrInfo[page]);
      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          let status = self.transHistory[item].status;
          let type = self.transHistory[item].annotate;
          if(!self.transHistory[item].validator) {
            return;
          }
          let getIndex = staking.stakingList.findIndex(value => value.validator.address === self.transHistory[item]["validator"]);
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[page][self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]["sendTime"],
            annotate: languageIntl.language && ['DelegateIn', 'DelegateOut'].includes(type) ? intl.get(`TransHistory.${type.toLowerCase()}`) : type,
            validator: {
              address: self.transHistory[item].validator,
              name: (getIndex === -1 || staking.stakingList[getIndex].validator.name === undefined) ? self.transHistory[item].validator : staking.stakingList[getIndex].validator.name,
              img: (getIndex === -1 || staking.stakingList[getIndex].validator.img === undefined) ? validatorImg : staking.stakingList[getIndex].validator.img,
            },
            stakeAmount: self.transHistory[item].stakeAmount,
          });
        }
      });

      page = 'ledger';
      addrList = Object.keys(self.addrInfo[page]);
      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          let type = self.transHistory[item].annotate;
          let status = self.transHistory[item].status;
          if(!self.transHistory[item].validator) {
            return;
          }

          let getIndex = staking.stakingList.findIndex(value => value.validator.address === self.transHistory[item]["validator"]);
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[page][self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]["sendTime"],
            annotate: languageIntl.language && ['DelegateIn', 'DelegateOut'].includes(type) ? intl.get(`TransHistory.${type.toLowerCase()}`) : type,
            validator: {
              address: self.transHistory[item].validator,
              name: (getIndex === -1 || staking.stakingList[getIndex].validator.name === undefined) ? self.transHistory[item].validator : staking.stakingList[getIndex].validator.name,
              img: (getIndex === -1 || staking.stakingList[getIndex].validator.img === undefined) ? validatorImg : staking.stakingList[getIndex].validator.img,
            },
            stakeAmount: self.transHistory[item].stakeAmount,
          });
        }
      });

      page = 'trezor';
      addrList = Object.keys(self.addrInfo[page]);
      Object.keys(self.transHistory).forEach(item => {
        if(addrList.includes(self.transHistory[item]["from"])) {
          let type = self.transHistory[item].annotate;
          let status = self.transHistory[item].status;
          if(!self.transHistory[item].validator) {
            //return;
          }

          let getIndex = staking.stakingList.findIndex(value => value.validator.address === self.transHistory[item]["validator"]);
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]["sendTime"]),
            from: self.addrInfo[page][self.transHistory[item]["from"]].name,
            to: self.transHistory[item].to,
            value: fromWei(self.transHistory[item].value),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]["sendTime"],
            annotate: languageIntl.language && ['DelegateIn', 'DelegateOut'].includes(type) ? intl.get(`TransHistory.${type.toLowerCase()}`) : type,
            validator: {
              address: self.transHistory[item].validator,
              name: (getIndex === -1 || staking.stakingList[getIndex].validator.name === undefined) ? self.transHistory[item].validator : staking.stakingList[getIndex].validator.name,
              img: (getIndex === -1 || staking.stakingList[getIndex].validator.img === undefined) ? validatorImg : staking.stakingList[getIndex].validator.img,
            },
            stakeAmount: self.transHistory[item].stakeAmount
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
