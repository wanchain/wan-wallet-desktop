
import wanUtil from 'wanchain-util';
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';

import languageIntl from './languageIntl';
import { checkAddrType } from 'utils/helper';
import { ETHPATH, WALLETID } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';

class EthAddress {
    @observable addrInfo = {
      normal: {},
    };

    @observable currentPage = [];

    @observable selectedAddr = '';

    @observable transHistory = {};

    @action addAddress (newAddr) {
      self.addrInfo['normal'][newAddr.address] = {
        name: `Account${newAddr.start + 1}`,
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

    @action updateTransHistory (initialize = false) {
      if (initialize) {
        self.transHistory = {};
      }
      wand.request('transaction_showRecords', (err, val) => {
        if (!err && val.length !== 0) {
          val = val.filter(item => item.chainType === 'ETH');
          val.forEach(item => {
            if (item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
              self.transHistory[item.txHash] = item;
            }
            if (item.txHash === '' && item.status === 'Failed') {
              self.transHistory[item.hashX] = item;
            }
          })
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
      keys.forEach(item => {
        if (normal.includes(item) && self.addrInfo['normal'][item].balance !== arr[item]) {
          self.addrInfo['normal'][item].balance = arr[item];
        }
      })
    }

    @action updateName (arr, chainType) {
      let walletID, type;
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
      }
      wand.request('account_update', { walletID, path: arr.path, meta: { name: arr.name, addr: arr.address.toLowerCase() } }, (err, val) => {
        if (!err && val) {
          self.addrInfo[type][arr['address']]['name'] = arr.name;
        }
      })
    }

    @action getUserAccountFromDB () {
      wand.request('account_getAll', { chainID: 60 }, (err, ret) => {
        if (err) console.log('Get user from DB failed ', err)
        if (ret.accounts && Object.keys(ret.accounts).length) {
          let info = ret.accounts;
          let typeFunc = id => id === '1' ? 'normal' : 'import';
          Object.keys(info).forEach(path => {
            Object.keys(info[path]).forEach(id => {
              if (['1', '5'].includes(id)) {
                let address = info[path][id]['addr'];
                self.addrInfo[typeFunc(id)][address.toLowerCase()] = {
                  name: info[path][id]['name'],
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

    @action setCurrPage (page) {
      self.currentPage = page;
    }

    @computed get getAddrList () {
      let addrList = [];
      let normalArr = Object.keys(self.addrInfo['normal']);
      normalArr.forEach(item => {
        addrList.push({
          key: item,
          name: self.addrInfo.normal[item].name,
          address: item,
          balance: formatNum(self.addrInfo.normal[item].balance),
          path: `${ETHPATH}${self.addrInfo.normal[item].path}`,
          action: 'send'
        });
      });
      return addrList;
    }

    @computed get getNormalAddrList () {
      let addrList = [];
      let normalArr = Object.keys(self.addrInfo['normal']);
      normalArr.forEach(item => {
        let type = 'normal';
        addrList.push({
          key: item,
          name: self.addrInfo[type][item].name,
          address: item,
          balance: self.addrInfo[type][item].balance,
          path: `${ETHPATH}${self.addrInfo[type][item].path}`,
          action: 'send'
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
        if (addrList.includes(self.transHistory[item]['from'])) {
          let status = self.transHistory[item].status;
          let type = checkAddrType(self.transHistory[item]['from'], self.addrInfo)
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]['sendTime']),
            from: self.addrInfo[type][self.transHistory[item]['from']].name,
            to: self.transHistory[item].to.toLowerCase(),
            value: formatNum(fromWei(self.transHistory[item].value)),
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]['sendTime'],
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
      Object.values({ normal: self.addrInfo.normal }).forEach(value => { sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0) });
      return formatNum(sum);
    }

    @computed get getAllAmount () {
      let sum = 0;
      Object.values(self.addrInfo).forEach(value => { sum += Object.values(value).reduce((prev, curr) => prev + parseFloat(curr.balance), 0) });
      return sum;
    }
}

const self = new EthAddress();
export default self;
