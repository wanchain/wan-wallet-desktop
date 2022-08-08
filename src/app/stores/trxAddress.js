
import { observable, action, computed, makeObservable } from 'mobx';
import { BigNumber } from 'bignumber.js';
import { getTypeByWalletId } from 'utils/helper';
import { TRXPATH, WALLETID } from 'utils/settings';
import { formatNum } from 'utils/support';

class TrxAddress {
  @observable addrInfo = {
    normal: {},
    rawKey: {}
  };

  @observable currentPage = [];

  @observable selectedAddr = '';

  constructor() {
    makeObservable(this);
  }

  @action addAddress(newAddr) {
    self.addrInfo['normal'][newAddr.address] = {
      name: newAddr.name ? newAddr.name : `Tron-Account${Number(newAddr.start) + 1}`,
      address: newAddr.address,
      balance: '0',
      path: newAddr.start
    };
  }

  @action deleteAddress(type, addr) {
    delete self.addrInfo[type][addr];
  }

  @action updateAddress(type, newAddress = {}) {
    if (typeof type === 'string') {
      self.addrInfo[type] = newAddress;
    } else {
      type.forEach(item => { self.addrInfo[item] = newAddress })
    }
  }

  @action addAddresses(type, addrArr) {
    addrArr.forEach(addr => {
      if (!Object.keys(self.addrInfo[type] || []).includes(addr.address)) {
        if (addr.name === undefined) {
          addr.name = `Tron-Account${parseInt(((/[0-9]+$/)).exec(addr.path)[0]) + 1}`;
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

  @action setSelectedAddr(addr) {
    if (typeof addr === 'string') {
      self.selectedAddr = [addr];
    } else {
      self.selectedAddr = addr;
    }
  }

  @action updateTRXBalance(arr) {
    let keys = Object.keys(arr);
    let normal = Object.keys(self.addrInfo['normal']);
    let rawKey = Object.keys(self.addrInfo['rawKey']);

    keys.forEach(item => {
      if (normal.includes(item) && self.addrInfo['normal'][item].balance !== arr[item]) {
        self.addrInfo['normal'][item].balance = arr[item];
      }
      if (rawKey.includes(item) && self.addrInfo['rawKey'][item].balance !== arr[item]) {
        self.addrInfo['rawKey'][item].balance = arr[item];
      }
    })
  }

  @action updateName(arr, wid) {
    let type = getTypeByWalletId(wid);
    wand.request('account_update', { walletID: wid, path: arr.path, meta: { name: arr.name, addr: arr.address.toLowerCase() } }, (err, val) => {
      if (!err && val) {
        self.addrInfo[type][arr.address].name = arr.name;
      }
    })
  }

  @action getUserAccountFromDB() {
    wand.request('account_getAll', { chainID: 195 }, (err, ret) => {
      if (err) console.log('Get user from DB failed ', err)
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
            if (['1', '5', '6'].includes(id)) {
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

  @action addRawKey({ path, name, addr }) {
    self.addrInfo['rawKey'][addr] = {
      name: name,
      balance: '0',
      path: path,
      address: addr,
    };
  }

  @action setCurrPage(page) {
    self.currentPage = page;
  }

  @computed get getAddrList() {
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
          path: `${TRXPATH}${obj[item].path}`,
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

  @computed get getNormalAddrList() {
    let addrList = [];
    let normalArr = Object.keys(self.addrInfo.normal);
    normalArr.forEach(item => {
      let type = 'normal';
      addrList.push({
        key: item,
        name: self.addrInfo[type][item].name,
        address: item,
        balance: self.addrInfo[type][item].balance,
        path: `${TRXPATH}${self.addrInfo[type][item].path}`,
        action: 'send',
        wid: WALLETID.NATIVE
      });
    });
    return addrList;
  }

  @computed get addrSelectedList() {
    let addrList = []
    Object.keys(self.addrInfo['normal']).forEach(addr => {
      addrList.push(addr);
    });
    return addrList;
  }

  @computed get getNormalAmount() {
    let sum = 0;
    Object.values({ normal: self.addrInfo.normal }).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
    return formatNum(sum.toString());
  }

  @computed get getAllAmount() {
    let sum = 0;
    Object.values(self.addrInfo).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
    return sum.toString();
  }
}

const self = new TrxAddress();
export default self;
