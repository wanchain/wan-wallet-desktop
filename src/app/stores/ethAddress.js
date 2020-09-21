
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import { BigNumber } from 'bignumber.js';

import tokens from './tokens';
import languageIntl from './languageIntl';
import { checkAddrType, getTypeByWalletId } from 'utils/helper';
import { ETHPATH, WALLETID } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';

class EthAddress {
    @observable addrInfo = {
      normal: {},
      rawKey: {}
    };

    @observable currentPage = [];

    @observable selectedAddr = '';

    @observable transHistory = {};

    @action addAddress (newAddr) {
      self.addrInfo['normal'][newAddr.address] = {
        name: newAddr.name ? newAddr.name : `ETH-Account${newAddr.start + 1}`,
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
        if (!Object.keys(self.addrInfo[type] || []).includes(addr.address)) {
          if (addr.name === undefined) {
            addr.name = `ETH-Account${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
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

    @action updateTransHistory (initialize = false) {
      if (initialize) {
        self.transHistory = {};
      }
      wand.request('transaction_showRecords', (err, val) => {
        if (!err && val.length !== 0) {
          let tmpTransHistory = {};
          val = val.filter(item => item.chainType === 'ETH');
          val.forEach(item => {
            if (item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
              tmpTransHistory[item.txHash] = item;
            }
            if (item.txHash === '' && item.status === 'Failed') {
              tmpTransHistory[item.hashX] = item;
            }
          });
          self.transHistory = tmpTransHistory;
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

    @action updateETHBalance (arr) {
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

    @action updateName (arr, wid) {
      let type = getTypeByWalletId(wid);
      wand.request('account_update', { walletID: wid, path: arr.path, meta: { name: arr.name, addr: arr.address.toLowerCase() } }, (err, val) => {
        if (!err && val) {
          self.addrInfo[type][arr.address].name = arr.name;
        }
      })
    }

    @action getUserAccountFromDB () {
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

    @action setCurrPage (page) {
      self.currentPage = page;
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
            balance: formatNum(obj[item].balance),
            path: `${ETHPATH}${obj[item].path}`,
            action: 'send',
            wid: walletID
          });
        });
      });
      return addrList;
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
          path: `${ETHPATH}${self.addrInfo[type][item].path}`,
          action: 'send',
          wid: WALLETID.NATIVE
        });
      });
      return addrList;
    }

    @computed get historyList () {
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
        if (addrList.includes(self.transHistory[item].from) && !self.transHistory[item].transferTo) {
          let status = self.transHistory[item].status;
          let type = checkAddrType(self.transHistory[item].from, self.addrInfo)
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item].sendTime),
            from: self.addrInfo[type][self.transHistory[item].from].name,
            to: self.transHistory[item].to.toLowerCase(),
            value: formatNum(fromWei(self.transHistory[item].value)),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item].sendTime,
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
        if (addrList.includes(self.transHistory[item].from) && self.transHistory[item].transferTo && (tokens.currTokenAddr.toLowerCase() === self.transHistory[item].to.toLowerCase())) {
          let status = self.transHistory[item].status;
          let type = checkAddrType(self.transHistory[item].from, self.addrInfo);

          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item].sendTime),
            from: self.addrInfo[type][self.transHistory[item].from].name,
            to: self.transHistory[item].transferTo.toLowerCase(),
            value: formatNum(self.transHistory[item].token || 0),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item].sendTime,
          });
        }
      });
      return historyList.sort((a, b) => b.sendTime - a.sendTime);
    }

    @computed get addrSelectedList () {
      let addrList = []
      Object.keys(self.addrInfo['normal']).forEach(addr => {
        addrList.push(addr);
      });
      return addrList;
    }

    @computed get getNormalAmount () {
      let sum = 0;
      Object.values({ normal: self.addrInfo.normal }).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
      return formatNum(sum.toString());
    }

    @computed get getAllAmount () {
      let sum = 0;
      Object.values(self.addrInfo).forEach(value => { sum = new BigNumber(sum).plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(curr.balance), 0)) });
      return sum.toString();
    }
}

const self = new EthAddress();
export default self;
