import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import languageIntl from './languageIntl';
import { EOSPATH, WALLETID } from 'utils/settings';
import { getTypeByWalletId } from 'utils/helper';
import { timeFormat, formatNum } from 'utils/support';
import { BigNumber } from 'bignumber.js';

class EosAddress {
  @observable keyInfo = {
    normal: {},
    rawKey: {}
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
    };
  }

  @action deleteKey(type, key) {
    delete self.addrInfo[type][key];
    this.updateTransHistory();
  }

  @action addRawKey({ publicKey, start, path }) {
    self.keyInfo['rawKey'][publicKey] = {
      name: `Imported${start + 1}`,
      path: path,
    };
  }

  @action updateKeyName(row, wid) {
    let type = getTypeByWalletId(wid);
    wand.request('account_update', { walletID: wid, path: row.path, meta: { name: row.name, publicKey: row.publicKey } }, (err, res) => {
      if (!err && res) {
        self.keyInfo[type][row['publicKey']]['name'] = row.name;
      } else {
        console.log('Update key name failed');
      }
    })
  }

  @action setImportedUserAccount(accounts, network, wid, path, pubKey) {
    return new Promise((resolve, reject) => {
      wand.request('account_setImportedUserAccounts', { accounts, network, wid, path, pubKey }, (err, res) => {
        if (!err) {
          resolve();
        } else {
          console.log('Update accounts failed');
          reject(err);
        }
      });
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
    let rawKey = self.keyInfo['rawKey'];

    [normal, rawKey].forEach((obj, index) => {
      const walletID = obj === normal ? WALLETID.NATIVE : WALLETID.RAWKEY;
      Object.keys(obj).forEach((item) => {
        keyList.push({
          name: obj[item].name,
          path: obj[item].path,
          publicKey: item,
          wid: walletID
        });
      });
    });
    return keyList;
  }

  @computed get getAccountList() {
    return Object.values(self.accountInfo);
  }

  @computed get getAccountListWithBalance() {
    return Object.values(self.accountInfo);
  }

  @computed get getAccount() {
    return Object.keys(self.accountInfo);
  }

  @action getUserKeyFromDB() {
    wand.request('account_getAll', { chainID: 194 }, (err, ret) => {
      if (err) {
        console.log('Get user from DB failed ', err);
        return;
      }
      let info = ret.accounts;
      if (ret && info instanceof Object && Object.keys(info).length) {
        let typeFunc = id => {
          switch (id) {
            case '1':
              return 'normal';
            case '6':
              return 'rawKey';
          }
        };
        Object.keys(info).forEach(path => {
          Object.keys(info[path]).forEach(id => {
            if (['1', '6'].includes(id)) {
              let item = info[path][id];
              self.keyInfo[typeFunc(id)][item.publicKey] = {
                name: item.name,
                path: path
              }
            }
          })
        })
      }
    });

    wand.request('account_getAllAccounts', { chainID: 194 }, (err, ret) => {
      if (err) {
        console.log('Get user from DB failed ', err);
        return;
      }
      if (ret && ret instanceof Object && Object.keys(ret).length) {
        Object.keys(ret).forEach(name => {
          let item = ret[name]['active']['keys']['1'];
          const path = Object.keys(item)[0];
          if (name in self.accountInfo) {
            self.accountInfo[name].path = path;
            self.accountInfo[name].account = name;
            self.accountInfo[name].id = '1';
          } else {
            self.accountInfo[name] = {
              path: path,
              account: name,
              id: '1'
            }
          }
        });
      }
    });
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
        self.accountInfo[name] = Object.assign({}, self.accountInfo[name], obj[name]);
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
      let obj = self.transHistory[item];
      if (!obj.action) {
        if (!self.historySelectedAccountName || self.historySelectedAccountName === obj['from']) {
          let status = obj.status;
          let value = `0`;
          if (obj['value']) {
            value = new BigNumber(obj['value'].replace(/ EOS/, '')).toString();
          }
          historyList.push({
            key: item,
            time: timeFormat(obj['sendTime']),
            from: obj['from'],
            to: obj['to'],
            value: `${value} EOS`,
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: obj['sendTime'],
            txHash: obj['txHash']
          });
        }
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get resourceHistoryList() {
    let historyList = [];
    Object.keys(self.transHistory).forEach(item => {
      let obj = self.transHistory[item];
      if (obj.action) {
        if (!self.historySelectedAccountName || self.historySelectedAccountName === obj['from']) {
          let status = obj.status;
          let value = '';
          switch (obj['action']) {
            case 'buyrambytes':
              value = `${obj['ramBytes']} KB`;
              break;
            case 'sellram':
              value = `${obj['ramBytes']} KB`;
              break;
            case 'newaccount':
              let ram = obj['ramBytes'];
              let cpu = obj['cpuAmount'];
              let net = obj['netAmount'];
              value = `${ram}KB/ ${Number(cpu.replace(/ EOS/, ''))}EOS/ ${Number(net.replace(/ EOS/, ''))}EOS`;
              break;
            case 'delegatebw':
              if (obj['cpuAmount'] === '0.0000 EOS') {
                value = `${obj['netAmount']}`;
              } else {
                value = `${obj['cpuAmount']}`;
              }
              break;
            case 'undelegatebw':
              if (obj['cpuAmount'] === '0.0000 EOS') {
                value = `${obj['netAmount']}`;
              } else {
                value = `${obj['cpuAmount']}`;
              }
              break;
            default:
              value = obj['value'];
          }
          if (value.indexOf(' EOS') !== -1) {
              value = `${new BigNumber(value.replace(/ EOS/, '')).toString()} EOS`
          }
          historyList.push({
            key: item,
            time: timeFormat(obj['sendTime']),
            from: obj['from'],
            to: obj['to'],
            value: value,
            status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
            sendTime: obj['sendTime'],
            action: obj['action'],
            txHash: obj['txHash']
          });
        }
      }
    });
    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }
}

const self = new EosAddress();
export default self;
