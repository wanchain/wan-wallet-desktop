import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import languageIntl from './languageIntl';
import { EOSPATH } from 'utils/settings';
import { timeFormat, formatNum } from 'utils/support';
import { BigNumber } from 'bignumber.js';

class EosAddress {
  @observable keyInfo = {
    normal: {},
  };

  @observable accountInfo = {};

  @observable currentPage = [];

  @observable historySelectedAccountName = '';

  @observable selectedAccount = {};

  @observable transHistory = {};

  @action addKey(newKey) {
    self.keyInfo['normal'][newKey.publicKey] = {
      name: `EOS-PublicKey${newKey.start + 1}`,
      path: newKey.path,
      accounts: newKey.accounts ? newKey.accounts : []
    };
  }

  @action updateKeyName(row, chainType) {
    let walletID = 1;
    wand.request('account_update', { walletID, path: row.path, meta: { name: row.name, publicKey: row.publicKey, accounts: row.accounts } }, (err, res) => {
      if (!err && res) {
        self.keyInfo[chainType][row['publicKey']]['name'] = row.name;
      } else {
        console.log('Update key name failed');
      }
    })
  }

  @action updateAccounts(row, chainType) {
    return new Promise((resolve, reject) => {
      let walletID = 1;
      wand.request('account_update', { walletID, path: row.path, meta: { name: row.name, publicKey: row.publicKey, accounts: row.accounts } }, (err, res) => {
        if (!err && res) {
          self.keyInfo[chainType][row['publicKey']]['accounts'] = row.accounts;
          Object.values(row.accounts).forEach((v) => {
            if (!self.accountInfo[v]) {
              self.accountInfo[v] = {
                publicKey: row.publicKey,
                path: row.path
              }
            }
          })
          resolve();
        } else {
          console.log('Update accounts failed');
          reject(err);
        }
      })
    });
  }

  @action setHistorySelectedAccountName(name) {
    self.historySelectedAccountName = name;
  }

  @action setCurrPage(page) {
    self.currentPage = page;
  }

  @computed get getKeyList() {
    let keyList = [];
    let normal = self.keyInfo['normal'];
    Object.keys(normal).forEach((key) => {
      let item = normal[key];
      keyList.push({
        name: item.name,
        path: item.path,
        publicKey: key,
        accounts: item.accounts ? [].concat(item.accounts) : [],
      });
    });
    return keyList;
  }

  @computed get getAccountList() {
    return Object.values(self.accountInfo);
  }

  @computed get getAccount() {
    return Object.keys(self.accountInfo);
  }

  @action getUserKeyFromDB() {
    wand.request('account_getAll', { chainID: 194 }, (err, ret) => {
      if (err) console.log('Get user from DB failed ', err)
      let info = ret.accounts;
      if (info && Object.keys(info).length) {
        let typeFunc = id => id === '1' ? 'normal' : 'import';
        Object.keys(info).forEach(path => {
          Object.keys(info[path]).forEach(id => {
            if (['1'].includes(id)) {
              let item = info[path][id];
              self.keyInfo[typeFunc(id)][item.publicKey] = {
                name: item.name,
                path: path.substr(path.lastIndexOf('\/') + 1),
                accounts: item.accounts
              }
              Object.values(item.accounts).forEach((v) => {
                if (!self.accountInfo[v]) {
                  self.accountInfo[v] = {
                    publicKey: item.publicKey,
                    path: path
                  }
                }
              })
            }
          })
        });
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
        val = val.filter(item => item.chainType === 'EOS');
        val.forEach(item => {
          if (item.txHash !== '' && (item.txHash !== item.hashX || item.status === 'Failed')) {
            tmp[item.txHash] = item;
          }
          if (item.txHash === '' && item.status === 'Failed') {
            tmp[item.hashX] = item;
          }
        })
        self.transHistory = tmp;
      }
    })
  }

  @action updateEOSBalance(obj) {
    let keys = Object.keys(obj);
    let accounts = Object.keys(self.accountInfo);
    keys.forEach(name => {
      if (accounts.includes(name)) {
        obj[name].publicKey = self.accountInfo[name].publicKey;
        obj[name].account = name;
        obj[name].path = self.accountInfo[name].path;
        self.accountInfo[name] = obj[name];
      }
    })
  }

  @action updateSelectedAccount(obj) {
    self.selectedAccount = obj;
  }

  @computed get getAllAmount() {
    let sum = Object.values(self.accountInfo).reduce((prev, curr) => {
      if (curr.balance) {
        return prev instanceof BigNumber ? prev.plus(new BigNumber(curr.balance)) : new BigNumber(prev).plus(new BigNumber(curr.balance));
      } else {
        return prev instanceof BigNumber ? prev : new BigNumber(prev);
      }
    }, 0);
    return sum.toString(10);
  }

  @computed get normalHistoryList() {
    let historyList = [];
    Object.keys(self.transHistory).forEach(item => {
      if (!self.transHistory[item].action) {
        if (!self.historySelectedAccountName || self.historySelectedAccountName === self.transHistory[item]['from']) {
          let status = self.transHistory[item].status;
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]['sendTime']),
            from: self.transHistory[item]['from'],
            to: self.transHistory[item]['to'],
            value: self.transHistory[item]['value'],
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]['sendTime'],
            txHash: self.transHistory[item]['txHash']
          });
        }
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get resourceHistoryList() {
    let historyList = [];
    Object.keys(self.transHistory).forEach(item => {
      if (self.transHistory[item].action) {
        if (!self.historySelectedAccountName || self.historySelectedAccountName === self.transHistory[item]['from']) {
          let status = self.transHistory[item].status;
          let value = '';
          switch (self.transHistory[item]['action']) {
            case 'buyrambytes':
              value = `${self.transHistory[item]['ramBytes']} KB`;
              break;
            case 'sellram':
              value = `${self.transHistory[item]['ramBytes']} KB`;
              break;
            case 'newaccount':
              let ram = self.transHistory[item]['ramBytes'];
              let cpu = self.transHistory[item]['cpuAmount'];
              let net = self.transHistory[item]['netAmount'];
              value = `${ram}KB/ ${Number(cpu.replace(/ EOS/, ''))}EOS/ ${Number(net.replace(/ EOS/, ''))}EOS`;
              break;
            case 'delegatebw':
              if (self.transHistory[item]['cpuAmount'] === '0.0000 EOS') {
                value = `${self.transHistory[item]['netAmount']}`;
              } else {
                value = `${self.transHistory[item]['cpuAmount']}`;
              }
              break;
            case 'undelegatebw':
              if (self.transHistory[item]['cpuAmount'] === '0.0000 EOS') {
                value = `${self.transHistory[item]['netAmount']}`;
              } else {
                value = `${self.transHistory[item]['cpuAmount']}`;
              }
              break;
            default:
              value = self.transHistory[item]['value'];
          }
          historyList.push({
            key: item,
            time: timeFormat(self.transHistory[item]['sendTime']),
            from: self.transHistory[item]['from'],
            to: self.transHistory[item]['to'],
            value: value,
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: self.transHistory[item]['sendTime'],
            action: self.transHistory[item]['action'],
            txHash: self.transHistory[item]['txHash']
          });
        }
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }
}

const self = new EosAddress();
export default self;
