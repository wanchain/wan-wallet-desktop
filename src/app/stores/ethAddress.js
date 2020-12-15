
import intl from 'react-intl-universal';
import { observable, action, computed } from 'mobx';
import { BigNumber } from 'bignumber.js';
import tokens from './tokens';
import languageIntl from './languageIntl';
import ethUtil from 'ethereumjs-util';
import { checkAddrType, getTypeByWalletId } from 'utils/helper';
import { ETHPATH, WALLETID } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';

class EthAddress {
  @observable addrInfo = {
    normal: {},
    ledger: {},
    trezor: {},
    rawKey: {}
  };

  @observable currentPage = [];

  @observable selectedAddr = '';

  @observable transHistory = {};

  @action addAddress(newAddr) {
    self.addrInfo['normal'][newAddr.address] = {
      name: newAddr.name ? newAddr.name : `ETH-Account${Number(newAddr.start) + 1}`,
      address: newAddr.address,
      balance: '0',
      path: newAddr.start
    };
  }

  @action deleteAddress(type, addr) {
    delete self.addrInfo[type][addr];
    this.updateTransHistory();
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
          if (type === 'ledger') {
            addr.name = `Ledger${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
          } else if (type === 'trezor') {
            addr.name = `Trezor${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
          } else {
            addr.name = `ETH-Account${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
          }
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
        val = val.filter(item => item.chainType === 'ETH');
        val.forEach(item => {
          item.from = ethUtil.toChecksumAddress(item.from);
          if (item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
            tmp[item.txHash] = item;
          }
          if (item.txHash === '' && item.status === 'Failed') {
            tmp[item.hashX] = item;
          }
        });
        self.transHistory = tmp;
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

  @action updateETHBalance(arr) {
    let keys = Object.keys(arr);
    let normal = Object.keys(self.addrInfo['normal']);
    let ledger = Object.keys(self.addrInfo['ledger']);
    let trezor = Object.keys(self.addrInfo['trezor']);
    let rawKey = Object.keys(self.addrInfo['rawKey']);
    keys.forEach(item => {
      if (normal.includes(item) && self.addrInfo['normal'][item].balance !== arr[item]) {
        self.addrInfo['normal'][item].balance = arr[item];
      }
      if (ledger.includes(item) && self.addrInfo['ledger'][item].balance !== arr[item]) {
        self.addrInfo['ledger'][item].balance = arr[item];
      }
      if (trezor.includes(item) && self.addrInfo['trezor'][item].balance !== arr[item]) {
        self.addrInfo['trezor'][item].balance = arr[item];
      }
      if (rawKey.includes(item) && self.addrInfo['rawKey'][item].balance !== arr[item]) {
        self.addrInfo['rawKey'][item].balance = arr[item];
      }
    })
  }

  @action updateName(obj, wid) {
    let type = getTypeByWalletId(wid);
    wand.request('account_update', { walletID: wid, path: obj.path, meta: { name: obj.name, addr: obj.address.toLowerCase() } }, (err, val) => {
      if (!err && val) {
        self.addrInfo[type][obj.address].name = obj.name;
      }
    })
  }

  @action getUserAccountFromDB() {
    wand.request('account_getAll', { chainID: 60 }, (err, ret) => {
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
              self.addrInfo[typeFunc(id)][address.toLowerCase()] = {
                name: info[path][id].name,
                balance: 0,
                path: path.substr(path.lastIndexOf('\/') + 1),
                address: address.toLowerCase()
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
          path: `${ETHPATH}${obj[item].path}`,
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
        path: `${ETHPATH}${self.addrInfo[type][item].path}`,
        action: 'send',
        wid: WALLETID.NATIVE
      });
    });
    return addrList;
  }

  @computed get ledgerAddrList() {
    let addrList = [];
    let type = 'ledger';
    Object.keys(self.addrInfo[type]).forEach(item => {
      addrList.push({
        key: item,
        name: self.addrInfo[type][item].name,
        address: item,
        balance: self.addrInfo[type][item].balance,
        path: self.addrInfo[type][item].path,
        action: 'send',
        wid: WALLETID.LEDGER
      });
    });
    return addrList;
  }

  @computed get trezorAddrList() {
    let addrList = [];
    let type = 'trezor';
    Object.keys(self.addrInfo[type]).forEach(item => {
      addrList.push({
        key: item,
        name: self.addrInfo[type][item].name,
        address: item,
        balance: self.addrInfo[type][item].balance,
        path: self.addrInfo[type][item].path,
        action: 'send',
        wid: WALLETID.TREZOR
      });
    });
    return addrList;
  }

  @computed get historyList() {
    let historyList = [];
    let page = self.currentPage;
    let addrList = [];
    if (self.selectedAddr) {
      addrList = self.selectedAddr;
    } else {
      page.forEach(name => {
        addrList = addrList.concat(Object.keys(self.addrInfo[name]));
      })
    }
    Object.keys(self.transHistory).forEach(item => {
      let data = self.transHistory[item];
      if (addrList.includes(data.from) && !data.transferTo) {
        let status = data.status;
        let type = checkAddrType(data.from, self.addrInfo);
        historyList.push({
          key: item,
          time: timeFormat(data.sendTime),
          from: self.addrInfo[type][data.from].name,
          to: data.to.toLowerCase(),
          value: formatNum(fromWei(data.value)),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: data.sendTime,
        });
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get tokenTransferHistoryList() {
    let historyList = [];
    let page = self.currentPage;
    let addrList = [];
    if (self.selectedAddr) {
      addrList = self.selectedAddr
    } else {
      page.forEach(name => {
        addrList = addrList.concat(Object.keys(self.addrInfo[name] || []))
      })
    }
    Object.keys(self.transHistory).forEach(item => {
      let data = self.transHistory[item];
      if (addrList.includes(data.from) && data.transferTo && (tokens.currTokenAddr.toLowerCase() === data.to.toLowerCase())) {
        let status = data.status;
        let type = checkAddrType(data.from, self.addrInfo);

        historyList.push({
          key: item,
          time: timeFormat(data.sendTime),
          from: self.addrInfo[type][data.from].name,
          to: data.transferTo.toLowerCase(),
          value: formatNum(data.token || 0),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: data.sendTime,
        });
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
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

const self = new EthAddress();
export default self;
