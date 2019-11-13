import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import languageIntl from './languageIntl';
import { checkAddrType } from 'utils/helper';
import { EOSPATH } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';

class EosAddress {
  @observable keyInfo = {
    normal: {},
  };

  @observable currentPage = [];

  @observable selectedKey = '';

  @observable transHistory = {};

  @action addKey(newKey) {
    // console.log('addKey', newKey);
    self.keyInfo['normal'][newKey.publicKey] = {
      name: `EOS-PublicKey${newKey.start + 1}`,
      publicKey: newKey.publicKey,
      path: newKey.path
    };
  }

  @computed get getKeyList() {
    let keyList = [];
    let normal = self.keyInfo['normal'];
    Object.keys(normal).forEach((key) => {
      let item = normal[key];
      keyList.push({
        name: item.name,
        path: item.path,
        key: key,
        accounts: item.accounts ? [].concat(item.accounts) : [],
      });
    });
    return keyList;
  }

  @computed get getAccountList() {
    let keyList = [{
      name: 'A',
      value: '12',
      cpu: '23',
      balance: '12.21'
    }, {
      name: 'B',
      value: '4',
      cpu: '34',
      balance: '42.32'
    }];
    return keyList;
  }

  @action getUserKeyFromDB() {
    wand.request('account_getAll', { chainID: 194 }, (err, ret) => {
      console.log('getUserKeyFromDB:', ret, err);
      if (err) console.log('Get user from DB failed ', err)
      let info = ret.accounts;
      if (info && Object.keys(info).length) {
        let typeFunc = id => id === '1' ? 'normal' : 'import';
        Object.keys(info).forEach(path => {
          Object.keys(info[path]).forEach(id => {
            if (['1', '5'].includes(id)) {
              let item = info[path][id];
              self.keyInfo[typeFunc(id)][item.publicKey.toLowerCase()] = {
                name: item.name,
                path: path + id,
                accounts: item.accounts
              }
            }
          })
        })
      }
    })
  }
}

const self = new EosAddress();
export default self;
