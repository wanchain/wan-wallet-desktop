
import intl from 'react-intl-universal';
import { observable, action, computed, toJS, makeObservable } from 'mobx';
import { BigNumber } from 'bignumber.js';

import languageIntl from './languageIntl';
import { timeFormat, formatNum, formatNumByDecimals } from 'utils/support';
import { getTypeByWalletId } from 'utils/helper';
import { BTCPATH_MAIN, BTCPATH_TEST, WALLETID, CHAINID, BTCCHAINID } from 'utils/settings';

import session from './session';

class BtcAddress {
  @observable addrInfo = {
    normal: {},
    rawKey: {}
  };

  @observable utxos = {};

  @observable currentPage = [];

  @observable selectedAddr = '';

  @observable transHistory = {};

  constructor() {
    makeObservable(this);
  }

  @computed get btcPath() {
    return session.chainId === CHAINID.MAIN ? BTCPATH_MAIN : BTCPATH_TEST;
  }

  @action updateUtxos(newUtxos) {
    self.utxos = newUtxos;
  }

  @action setCurrPage (page) {
    self.currentPage = page;
  }

  @action addAddress (newAddr) {
    self.addrInfo.normal[newAddr.address] = {
      name: newAddr.name ? newAddr.name : `BTC-Account${Number(newAddr.start) + 1}`,
      address: newAddr.address,
      balance: '0',
      path: newAddr.start
    };
  }

  @action deleteAddress(type, addr) {
    delete self.addrInfo[type][addr];
    this.updateTransHistory();
  }

  @action updateAddress (type, newAddress = {}) {
    if (typeof type === 'string') {
      self.addrInfo[type] = newAddress;
    } else {
      type.forEach(item => { self.addrInfo[item] = newAddress })
    }
  }

  @action addAddresses (type, addrArr) {
    addrArr.forEach(addr => {
      if (!Object.keys(self.addrInfo[type]).includes(addr.address)) {
        if (addr.name === undefined) {
          addr.name = `BTC-Account${parseInt(((/[0-9]+$/)).exec(addr.path)[0]) + 1}`;
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
    if (initialize) {
      self.transHistory = {};
    }
    wand.request('transaction_showRecords', (err, val) => {
      if (!err && val.length !== 0) {
        let tmp = {};
        val = val.filter(item => item.chainType === 'BTC');
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

  @action setSelectedAddr (addr) {
    if (typeof addr === 'string') {
      self.selectedAddr = [addr];
    } else {
      self.selectedAddr = addr;
    }
  }

  @action updateBTCBalance (arr) {
    let keys = Object.keys(arr);
    let normal = Object.keys(self.addrInfo.normal);
    let rawKey = Object.keys(self.addrInfo['rawKey']);
    keys.forEach(item => {
      if (normal.includes(item) && self.addrInfo.normal[item].balance !== arr[item]) {
        self.addrInfo.normal[item].balance = formatNumByDecimals(arr[item], 8);
      }
      if (rawKey.includes(item) && self.addrInfo['rawKey'][item].balance !== arr[item]) {
        self.addrInfo['rawKey'][item].balance = formatNumByDecimals(arr[item], 8);
      }
    })
  }

  @action updateName (arr, wid) {
    let type = getTypeByWalletId(wid);
    wand.request('account_update', { walletID: wid, path: arr.path, meta: { name: arr.name, addr: arr.address } }, (err, val) => {
      if (!err && val) {
        self.addrInfo[type][arr.address].name = arr.name;
      }
    })
  }

  @action getUserAccountFromDB (chainId) {
    let chainID = chainId === CHAINID.MAIN ? BTCCHAINID.MAIN : BTCCHAINID.TEST;
    wand.request('account_getAll', { chainID }, (err, ret) => {
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
                address: address
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

  @computed get getAddrList () {
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
          balance: formatNum(obj[item].balance, 8),
          path: `${self.btcPath}${obj[item].path}`,
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

  @computed get getNormalAddrList () {
    let addrList = [];
    let normalArr = Object.keys(self.addrInfo.normal);
    normalArr.forEach(item => {
      let type = 'normal';
      addrList.push({
        key: item,
        name: self.addrInfo[type][item].name,
        address: item,
        balance: self.addrInfo[type][item].balance,
        path: `${self.btcPath}${self.addrInfo[type][item].path}`,
        action: 'send',
        wid: WALLETID.NATIVE
      });
    });
    return addrList;
  }

  @computed get historyList() {
    let historyList = [];
    // console.log('his:', JSON.parse(JSON.stringify(self.transHistory)));
    Object.keys(self.transHistory).forEach(item => {
      let data = self.transHistory[item];
      let status = data.status;
      if (data.crossAddress === undefined) {
        historyList.push({
          key: item,
          time: timeFormat(data.sendTime / 1000),
          to: data.to,
          value: formatNum(data.value),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: data.sendTime,
        });
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get addrSelectedList () {
    let addrList = []
    Object.keys(self.addrInfo.normal).forEach(addr => {
      addrList.push(addr);
    });
    return addrList;
  }

  @computed get getNormalAmount () {
    let sum = 0;
    Object.values({ normal: self.addrInfo.normal }).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
    return sum.toString();
  }

  @computed get getAllAmount () {
    let sum = 0;
    Object.values(self.addrInfo).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
    return sum.toString();
  }
}

const self = new BtcAddress();
export default self;
