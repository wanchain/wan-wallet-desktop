
import wanUtil from 'wanchain-util';
import Identicon from 'identicon.js';
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';

import staking from './staking';
import languageIntl from './languageIntl';
import { checkAddrType } from 'utils/helper';
import { WANPATH, WALLETID } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';
import { BigNumber } from 'bignumber.js';

const WAN = "m/44'/5718350'/0'/0/";

class WanAddress {
  @observable addrInfo = {
    normal: {},
    ledger: {},
    trezor: {},
    import: {},
  };

  @observable currentPage = [];

  @observable selectedAddr = '';

  @observable transHistory = {};

  @action addAddress(newAddr) {
    self.addrInfo['normal'][newAddr.address] = {
      name: `Account${newAddr.start + 1}`,
      address: newAddr.address,
      waddress: newAddr.waddress,
      balance: '0',
      wbalance: '0',
      path: newAddr.start
    };
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
      if (!Object.keys(self.addrInfo[type]).includes(addr.address)) {
        if (addr.name === undefined && type === 'ledger') {
          addr.name = `Ledger${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
        }
        if (addr.name === undefined) {
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
    if (initialize) {
      self.transHistory = {};
    }
    wand.request('transaction_showRecords', (err, val) => {
      if (!err && val.length !== 0) {
        let obj = {};
        val.forEach(item => {
          item.from = wanUtil.toChecksumAddress(item.from);
          if (item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
            obj[item.txHash] = item;
          }
          if (item.txHash === '' && item.status === 'Failed') {
            obj[item.hashX] = item;
          }
        });
        self.transHistory = Object.assign({}, self.transHistory, obj);
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

  @action updateWANBalance({ balance: arr, privateBalance: parr }) {
    let keys = Object.keys(arr);
    let pKeys = Object.keys(parr);
    let normal = Object.keys(self.addrInfo['normal']);
    let ledger = Object.keys(self.addrInfo['ledger']);
    let trezor = Object.keys(self.addrInfo['trezor']);
    let importArr = Object.keys(self.addrInfo['import']);

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
      if (importArr.includes(item) && self.addrInfo['import'][item].balance !== arr[item]) {
        self.addrInfo['import'][item].balance = arr[item];
      }
    });

    pKeys.forEach(item => {
      if (normal.includes(item) && self.addrInfo['normal'][item].wbalance !== parr[item]) {
        self.addrInfo['normal'][item].wbalance = parr[item];
      }
      if (importArr.includes(item) && self.addrInfo['import'][item].wbalance !== parr[item]) {
        self.addrInfo['import'][item].wbalance = parr[item];
      }
    });
  }

  @action updateName(arr, chainType) {
    let walletID, type, index;
    console.log(arr);
    switch (chainType) {
      case 'normal':
        if (Object.keys(self.addrInfo['normal']).includes(arr.address)) {
          walletID = 1;
          type = 'normal';
        } else {
          walletID = WALLETID.KEYSTOREID;
          type = 'import';
        };
        break;

      case 'ledger':
        walletID = 2;
        type = 'ledger';
        index = arr.path.lastIndexOf('\/') + 1
        arr.path = `${arr.path.slice(0, index)}0/${arr.path.slice(index)}`;
        break;

      case 'trezor':
        walletID = 3;
        type = 'trezor';
        break;
    }
    wand.request('account_update', { walletID, path: arr.path, meta: { name: arr.name, addr: arr.address.toLowerCase(), waddr: arr.waddress.toLowerCase() } }, (err, val) => {
      if (!err && val) {
        self.addrInfo[type][arr['address']]['name'] = arr.name;
      }
    })
  }

  @action getUserAccountFromDB() {
    wand.request('account_getAll', { chainID: 5718350 }, async (err, ret) => {
      // console.log('getUserAccountFromDB:', ret);
      if (err) console.log('Get user from DB failed ', err)
      if (ret.accounts && Object.keys(ret.accounts).length) {
        let info = ret.accounts;
        let typeFunc = id => id === '1' ? 'normal' : 'import';
        let noWaddressArr = [];
        let accountObj = {};
        let checkExist = v => {
          if (accountObj[v]) {
            return true;
          } else {
            accountObj[v] = true;
            return false;
          }
        }
        let setAddrInfoFunc = obj => {
          // console.log('obj:', obj);
          self.addrInfo[typeFunc(obj.id)][wanUtil.toChecksumAddress(obj.address.toLowerCase())] = {
            name: obj.name,
            balance: 0,
            wbalance: 0,
            path: obj.path.substr(obj.path.lastIndexOf('\/') + 1),
            address: wanUtil.toChecksumAddress(obj.address),
            waddress: wanUtil.toChecksumOTAddress(obj.waddress)
          }
        };
        Object.keys(info).forEach(path => {
          Object.keys(info[path]).forEach(id => {
            if ([WALLETID.NATIVE, WALLETID.KEYSTOREID].includes(Number(id))) {
              let address = info[path][id]['addr'];
              let waddress = info[path][id]['waddr'];
              let name = info[path][id]['name'];
              if (checkExist(address.toLowerCase())) {
                // Delete the duplicate account info in DB file.
                wand.request('account_delete', { walletID: id === '1' ? WALLETID.NATIVE : WALLETID.KEYSTOREID, path }, async (err, ret) => {
                  console.log(err, ret);
                  if (err) console.log('Delete user from DB failed ', err);
                });
              } else {
                // If can not get the waddress, call a request to 'address_getOne' to get the waddress
                if (typeof waddress === 'undefined') {
                  let walletID = id === '1' ? WALLETID.NATIVE : WALLETID.KEYSTOREID;
                  noWaddressArr.push({ id, name, chainType: 'WAN', path, walletID });
                } else {
                  setAddrInfoFunc({ id, name, path, address, waddress });
                }
              }
            }
          })
        });

        // Insert none waddress account's waddress info into DB file.
        if (noWaddressArr.length === 0) return 0;
        await Promise.all(noWaddressArr.map(item => {
          return new Promise((resolve, reject) => {
            wand.request('address_getOne', { walletID: item.walletID, chainType: item.chainType, path: item.path }, (err, val) => {
              console.log(err, val);
              if (!err) {
                // Update the account waddress after obtaining waddress.
                wand.request('account_update', { walletID: item.walletID, path: item.path, meta: { name: item.name, addr: val.address.toLowerCase(), waddr: `0x${val.waddress}` } }, (err, res) => {
                  if (!err && res) {
                    setAddrInfoFunc({
                      id: item.id,
                      name: item.name,
                      path: item.path,
                      address: wanUtil.toChecksumAddress(val.address.toLowerCase()),
                      waddress: wanUtil.toChecksumOTAddress(`0x${val.waddress}`)
                    });
                    resolve();
                  } else {
                    reject(new Error(err.desc));
                  }
                })
              } else {
                reject(new Error(err.desc));
              }
            });
          });
        }));
      }
    })
  }

  @action addKeyStoreAddr({ path, addr, waddr }) {
    self.addrInfo['import'][addr] = {
      name: `Imported${path + 1}`,
      balance: '0',
      wbalance: '0',
      path: path,
      address: addr,
      waddress: waddr
    };
  }

  @action setCurrPage(page) {
    self.currentPage = page;
  }

  @action getPrivateAddr(addr) {
    let addrList = self.getAddrList;
    for (let i = 0; i < addrList.length; i++) {
      if (addrList[i].address === addr) {
        return addrList[i].waddress
      }
    }
    return '';
  }

  @computed get getAddrList() {
    let addrList = [];
    let normalArr = self.addrInfo['normal'];
    let importArr = self.addrInfo['import'];
    [normalArr, importArr].forEach((obj, index) => {
      const walletID = obj === normalArr ? 1 : 5;
      Object.keys(obj).forEach((item) => {
        addrList.push({
          key: `${WAN}${obj[item].path}-${item}`,
          name: obj[item].name,
          address: wanUtil.toChecksumAddress(item),
          waddress: obj[item].waddress,
          balance: obj[item].balance,
          wbalance: obj[item].wbalance,
          path: `${WAN}${obj[item].path}`,
          action: 'send',
          wid: walletID
        });
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
        path: `${WANPATH}${self.addrInfo[type][item].path}`,
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
    let historyList = [];
    let page = self.currentPage;
    let addrList = [];
    if (self.selectedAddr) {
      addrList = self.selectedAddr
    } else {
      page.forEach(name => {
        addrList = addrList.concat(Object.keys(self.addrInfo[name]))
      })
    }
    Object.keys(self.transHistory).forEach(item => {
      if (addrList.includes(self.transHistory[item]['from'])) {
        let status = self.transHistory[item].status;
        let type = checkAddrType(self.transHistory[item]['from'], self.addrInfo)
        historyList.push({
          key: item,
          time: timeFormat(self.transHistory[item]['sendTime']),
          from: self.addrInfo[type][self.transHistory[item]['from']].name,
          to: self.transHistory[item].to,
          value: formatNum(fromWei(self.transHistory[item].value)),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: self.transHistory[item]['sendTime'],
          offline: !!item.offline
        });
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get offlineHistoryList() {
    let historyList = [];

    Object.keys(self.transHistory).forEach(item => {
      if (self.transHistory[item].offline) {
        let status = self.transHistory[item].status;
        historyList.push({
          key: item,
          time: timeFormat(self.transHistory[item]['sendTime']),
          from: self.transHistory[item].from,
          to: self.transHistory[item].to,
          value: formatNum(fromWei(self.transHistory[item].value)),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: self.transHistory[item]['sendTime'],
        });
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  // TODO: need add hd
  @computed get stakingHistoryList() {
    let historyList = [];
    let histories = self.transHistory;
    let addrList = Object.keys(Object.assign({}, self.addrInfo.normal, self.addrInfo.ledger, self.addrInfo.trezor));
    Object.keys(self.transHistory).forEach(item => {
      if (histories[item].validator && addrList.includes(histories[item].from) && ['DelegateIn', 'DelegateOut'].includes(histories[item].annotate)) {
        let type = checkAddrType(histories[item].from, self.addrInfo);
        let { status, annotate } = histories[item];
        let getIndex = staking.stakingList.findIndex(value => value.validator.address === self.transHistory[item].validator);
        historyList.push({
          key: item,
          time: timeFormat(histories[item].sendTime),
          from: self.addrInfo[type][histories[item].from].name,
          to: histories[item].to,
          value: formatNum(fromWei(histories[item].value)),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: histories[item].sendTime,
          annotate: languageIntl.language && ['DelegateIn', 'DelegateOut'].includes(annotate) ? intl.get(`TransHistory.${annotate.toLowerCase()}`) : annotate,
          validator: {
            address: histories[item].validator,
            name: (getIndex === -1 || staking.stakingList[getIndex].validator.name === undefined) ? histories[item].validator : staking.stakingList[getIndex].validator.name,
            img: (getIndex === -1 || staking.stakingList[getIndex].validator.img === undefined) ? ('data:image/png;base64,' + new Identicon(histories[item].validator).toString()) : staking.stakingList[getIndex].validator.img,
          },
          stakeAmount: histories[item].stakeAmount,
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

    self.ledgerAddrList.forEach(addr => {
      addrList.push(
        'Ledger: ' + addr.address
      )
    });
    self.trezorAddrList.forEach(addr => {
      addrList.push(
        'Trezor: ' + addr.address
      )
    });
    return addrList;
  }

  @computed get getNormalAmount() {
    let sum = new BigNumber(0);
    Object.values({ normal: self.addrInfo.normal, import: self.addrInfo.import }).forEach(value => { sum = sum.plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(new BigNumber(curr.balance)).plus(new BigNumber(curr.wbalance)), 0)) });
    return formatNum(sum.toString(10));
  }

  @computed get getAllAmount() {
    let sum = new BigNumber(0);
    Object.values(self.addrInfo).forEach(value => {
      // sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0);
      sum = sum.plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(new BigNumber(curr.balance)).plus(isNaN(curr.wbalance) ? new BigNumber(0) : new BigNumber(curr.wbalance)), 0));
    });
    return sum.toString(10);
  }
}

const self = new WanAddress();
export default self;
