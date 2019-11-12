
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';

import languageIntl from './languageIntl';
import { timeFormat, formatNum, formatNumByDecimals } from 'utils/support';
import { BTCPATH_MAIN, BTCPATH_TEST, WALLETID, CHAINID, BTCCHAINID } from 'utils/settings';

import session from './session';

class BtcAddress {
    @observable addrInfo = {
      normal: {},
    };

    @observable utxos = {};

    @observable currentPage = [];

    @observable selectedAddr = '';

    @observable transHistory = {};

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
        name: `BTC-Account${newAddr.start + 1}`,
        address: newAddr.address,
        balance: '0',
        path: newAddr.start
      };
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
            addr.name = `BTC-Account${parseInt((/[0-9]+$/).exec(addr.path)[0]) + 1}`;
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
      wand.request('transaction_showBTCRecords', (err, val) => {
        if (!err && val.length !== 0) {
          let tmpTransHistory = {};
          val.forEach(item => {
            if (item.txhash !== '' && (item.txhash !== item.hashX || item.status === 'Failed')) {
              tmpTransHistory[item.txhash] = item;
            }
            if (item.txhash === '' && item.status === 'Failed') {
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

    @action updateBTCBalance (arr) {
      let keys = Object.keys(arr);
      let normal = Object.keys(self.addrInfo.normal);
      keys.forEach(item => {
        if (normal.includes(item) && self.addrInfo.normal[item].balance !== arr[item]) {
          self.addrInfo.normal[item].balance = formatNumByDecimals(arr[item], 8);
        }
      })
    }

    @action updateName (arr, chainType) {
      let walletID, type;
      switch (chainType) {
        case 'normal':
          if (Object.keys(self.addrInfo.normal).includes(arr.address)) {
            walletID = 1;
            type = 'normal';
          } else {
            walletID = WALLETID.KEYSTOREID;
            type = 'import';
          };
          break;
      }
      wand.request('account_update', { walletID, path: arr.path, meta: { name: arr.name, addr: arr.address } }, (err, val) => {
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
          let typeFunc = id => id === '1' ? 'normal' : 'import';
          Object.keys(info).forEach(path => {
            Object.keys(info[path]).forEach(id => {
              if (['1', '5'].includes(id)) {
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

    @computed get getAddrList () {
      let addrList = [];
      let normalArr = Object.keys(self.addrInfo.normal);
      normalArr.forEach(item => {
        addrList.push({
          key: item,
          name: self.addrInfo.normal[item].name,
          address: item,
          balance: formatNum(self.addrInfo.normal[item].balance, 8),
          path: `${self.btcPath}${self.addrInfo.normal[item].path}`,
          action: 'send'
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
          path: `${self.btcPath}${self.addrInfo[type][item].path}`,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get historyList () {
      let historyList = [];

      Object.keys(self.transHistory).forEach(item => {
        let status = self.transHistory[item].status;
        historyList.push({
          key: item,
          time: timeFormat(self.transHistory[item].time / 1000),
          to: self.transHistory[item].to.toLowerCase(),
          value: formatNum(self.transHistory[item].value),
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          sendTime: self.transHistory[item].time,
        });
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
      Object.values({ normal: self.addrInfo.normal }).forEach(value => { sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0) });
      return sum;
    }

    @computed get getAllAmount () {
      let sum = 0;
      Object.values(self.addrInfo).forEach(value => { sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0) });
      return sum;
    }
}

const self = new BtcAddress();
export default self;
