import { observable, action } from 'mobx';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;
  @observable chainId = 1;

  @action getMnemonic() {
    return new Promise((resolve, reject) => {
      wand.request('phrase_has', null, function (err, val) {
        if (!err) {
          self.hasMnemonicOrNot = val;
          resolve(val);
        } else {
          self.hasMnemonicOrNot = false;
          resolve(false);
        }
      }.bind(this));
    })
  }

  @action initChainId() {
    return new Promise((resolve, reject) => {
      wand.request('query_config', {
        param: 'network'
      }, function (err, val) {
        let chainId;
        if (err) {
          return reject('Get chain ID failed ', err);
        } else {
          if (val['network'].includes('main')) {
            chainId = 1;
          } else {
            chainId = 3;
          }
          self.chainId = chainId;
          return resolve(chainId);
        }
      }.bind(this));
    });
  }

  @action setMnemonicStatus(status) {
    self.hasMnemonicOrNot = status;
  }

  @action changeTitle(newTitle) {
    self.pageTitle = newTitle;
  }
}

const self = new Session();
export default self;
