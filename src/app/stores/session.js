import { observable, action, computed } from 'mobx';
import { getChainId } from 'utils/helper';
import intl from 'react-intl-universal';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;
  @observable chainId = 1;
  @observable auth = false;
  @observable language = 'en_US';

  @action setChainId(id) {
    self.chainId = id;
  }

  @action setLanguage(language) {
    self.language = language;
  }

  @action getMnemonic() {
    return new Promise((resolve, reject) => {
      wand.request('phrase_has', null, (err, val) => {
        if (!err) {
          self.hasMnemonicOrNot = val;
          resolve(val);
        } else {
          self.hasMnemonicOrNot = false;
          resolve(false);
        }
      });
    })
  }

  @action initChainId() {
    getChainId().then((chainId) => {
      self.chainId = chainId;
    });
  }

  @action setMnemonicStatus(status) {
    self.hasMnemonicOrNot = status;
  }

  @action setAuth(val) {
    self.auth = val;
  }

  @action changeTitle(newTitle) {
    self.pageTitle = newTitle;
  }

  @computed get transColumns() {
    return self.language && [
      {
        title: intl.get('TransHistory.time'),
        dataIndex: 'time',
        key: 'time',
      }, {
        title: intl.get('TransHistory.from'),
        dataIndex: 'from',
        key: 'from',
      }, {
        title: intl.get('TransHistory.to'),
        dataIndex: 'to',
        key: 'to',
      }, {
        title: intl.get('TransHistory.value'),
        dataIndex: 'value',
        key: 'value'
      }, {
        title: intl.get('TransHistory.status'),
        dataIndex: 'status',
        key: 'status'
      }
    ]
  };
}

const self = new Session();
export default self;
