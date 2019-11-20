import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import languageIntl from './languageIntl';
import { checkAddrType } from 'utils/helper';
import { EOSPATH } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';
import { BigNumber } from 'bignumber.js';

class EosAddress {
  @observable keyInfo = {
    normal: {},
  };

  @observable accountInfo = {};

  @observable currentPage = [];

  @observable selectedKey = '';

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
      console.log('update key name:', res);
      if (!err && res) {
        self.keyInfo[chainType][row['publicKey']]['name'] = row.name;
      } else {
        console.log('Update key name failed');
      }
    })
  }

  @action updateAccounts(row, chainType) {
    let walletID = 1;
    wand.request('account_update', { walletID, path: row.path, meta: { name: row.name, publicKey: row.publicKey, accounts: row.accounts } }, (err, res) => {
      if (!err && res) {
        self.keyInfo[chainType][row['publicKey']]['accounts'] = row.accounts;
      } else {
        console.log('Update accounts failed');
      }
    })
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
    // console.log(self.accountInfo);
    // console.log(Object.values(self.accountInfo));
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
                if (self.accountInfo[v]) {
                  // console.log('exist');
                } else {
                  self.accountInfo[v] = {
                    publicKey: item.publicKey
                  }
                }
              })
            }
          })
        });
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
        self.accountInfo[name] = obj[name];
      }
    })
  }

  @computed get getAllAmount() {
    let sum = new BigNumber(1234);
    /* Object.values(self.addrInfo).forEach(value => {
      sum = sum.plus(Object.values(value).reduce((prev, curr) => new BigNumber(prev).plus(new BigNumber(curr.balance)).plus(isNaN(curr.wbalance) ? new BigNumber(0) : new BigNumber(curr.wbalance)), 0));
    }); */
    return sum.toString(10);
  }
}

const self = new EosAddress();
export default self;
