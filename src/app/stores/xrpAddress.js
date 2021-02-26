import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { makeObservable, observable, computed, action } from 'mobx';

import languageIntl from './languageIntl';
import { XRPPATH, WALLETID } from 'utils/settings';
import { timeFormat, formatNum } from 'utils/support';
import { getTypeByWalletId, checkXRPAddrType } from 'utils/helper';

class XrpAddress {
  addrInfo = {
    normal: {},
    rawKey: {},
  }

  transHistory = {}

  constructor() {
    makeObservable(this, {
      addrInfo: observable,
      transHistory: observable,
      getAllAmount: computed,
      getAddrList: computed,
      historyList: computed,
      getNormalAddrList: computed,
      addAddress: action,
      deleteAddress: action,
      updateAddress: action,
      updateName: action,
      getUserAccountFromDB: action,
      updateXRPBalance: action,
      updateTransHistory: action,
      addRawKey: action
    })
  }

  get getAllAmount() {
    let sum = 0;
    Object.values(self.addrInfo).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
    return sum.toString();
  }

  get getNormalAddrList() {
    let addrList = [];
    let normalArr = Object.keys(self.addrInfo.normal);
    normalArr.forEach(item => {
      let type = 'normal';
      addrList.push({
        key: item,
        name: self.addrInfo[type][item].name,
        address: item,
        balance: self.addrInfo[type][item].balance,
        path: `${XRPPATH}${self.addrInfo[type][item].path}`,
        action: 'send',
        wid: WALLETID.NATIVE
      });
    });
    return addrList;
  }

  get getAddrList() {
    let addrList = [];
    let normalArr = self.addrInfo['normal'];
    let rawKeyArr = self.addrInfo['rawKey'];

    [normalArr, rawKeyArr].forEach((obj, index) => {
      const walletID = obj === normalArr ? WALLETID.NATIVE : WALLETID.RAWKEY;
      Object.keys(obj).forEach((item) => {
        addrList.push({
          key: item,
          name: obj[item].name,
          address: item,
          balance: formatNum(obj[item].balance),
          orignBalance: obj[item].balance,
          path: `${XRPPATH}${obj[item].path}`,
          action: 'send',
          wid: walletID
        });
      });
    });
    return addrList.sort((f, s) => {
      if (f.wid === s.wid) {
        return parseInt(f.path.substring(f.path.lastIndexOf('/') + 1)) > parseInt(s.path.substring(s.path.lastIndexOf('/') + 1)) ? 1 : -1;
      } else {
        return f.wid > s.wid ? 1 : -1;
      }
    });
  }

  get historyList() {
    try {
      let historyList = [];
      Object.keys(self.transHistory).forEach(item => {
        let data = self.transHistory[item];
        let { status, from, successTime, sendTime, value, to } = data;
        if (Object.values(self.addrInfo).find(item => Object.keys(item).includes(from))) {
          let type = checkXRPAddrType(self.transHistory[item].from, self.addrInfo);
          historyList.push({
            from: self.addrInfo[type][self.transHistory[item].from].name,
            fromAddr: from,
            key: item,
            time: timeFormat((successTime || sendTime)),
            to: to,
            value: formatNum(value),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime,
          });
        }
      });
      return historyList.sort((a, b) => b.sendTime - a.sendTime);
    } catch (e) {
      console.log('get history list failed:', e);
      return [];
    }
  }

  addAddress(newAddr) {
    self.addrInfo.normal[newAddr.address] = {
      name: newAddr.name ? newAddr.name : `XRP-Account${parseInt(newAddr.start) + 1}`,
      address: newAddr.address,
      balance: '0',
      path: newAddr.start
    };
  }

  deleteAddress(type, addr) {
    delete self.addrInfo[type][addr];
  }

  updateAddress(type, newAddress = {}) {
    if (typeof type === 'string') {
      self.addrInfo[type] = newAddress;
    } else {
      type.forEach(item => { self.addrInfo[item] = newAddress })
    }
  }

  updateName(arr, wid) {
    let type = getTypeByWalletId(wid);
    wand.request('account_update', { walletID: wid, path: arr.path, meta: { name: arr.name, addr: arr.address } }, (err, val) => {
      if (!err && val) {
        self.addrInfo[type][arr.address].name = arr.name;
      }
    })
  }

  getUserAccountFromDB() {
    wand.request('account_getAll', { chainID: 144 }, (err, ret) => {
      if (err) console.log('Get user from DB failed ', err);
      if (ret.accounts && Object.keys(ret.accounts).length) {
        let info = ret.accounts;
        let typeFunc = id => {
          switch (id) {
            case '1':
              return 'normal';
            case '5':
              return 'import';
            case '6':
              return 'rawKey';
          }
        };
        Object.keys(info).forEach(path => {
          Object.keys(info[path]).forEach(id => {
            if (['1', '6'].includes(id)) {
              let address = info[path][id].addr;
              self.addrInfo[typeFunc(id)][address] = {
                name: info[path][id].name,
                balance: 0,
                path: path.substr(path.lastIndexOf('\/') + 1),
                address
              }
            }
          })
        })
      }
    })
  }

  updateXRPBalance(arr) {
    let keys = Object.keys(arr);
    let normal = Object.keys(self.addrInfo.normal);
    let rawKey = Object.keys(self.addrInfo.rawKey);

    keys.forEach(item => {
      if (normal.includes(item) && self.addrInfo.normal[item].balance !== arr[item]) {
        self.addrInfo.normal[item].balance = arr[item];
      }
      if (rawKey.includes(item) && self.addrInfo.rawKey[item].balance !== arr[item]) {
        self.addrInfo.rawKey[item].balance = arr[item];
      }
    })
  }

  updateTransHistory(initialize = false) {
    if (initialize) {
      self.transHistory = {};
    }
    wand.request('transaction_showRecords', (err, val) => {
      if (!err && val.length !== 0) {
        let tmp = {};
        val = val.filter(item => item.chainType === 'XRP');
        val.forEach(item => {
          if (item.txHash && (item.txHash !== item.hashX || item.status === 'Failed')) {
            tmp[item.txHash] = item;
          }
          if (item.txHash === undefined) {
            tmp[item.hashX] = item;
          }
        });
        self.transHistory = tmp;
      }
    })
  }

  addRawKey({ path, name, addr }) {
    path = path.substring(path.lastIndexOf('/') + 1)
    self.addrInfo.rawKey[addr] = {
      name,
      balance: '0',
      path,
      address: addr,
    };
  }
}

const self = new XrpAddress();
export default self;
