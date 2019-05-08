import { observable, action } from 'mobx';
import { regEmitterHandler } from 'utils/helper';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;
  @observable chainId = 1;
  @observable auth = false;


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
    let chainId;
    regEmitterHandler('network', (val) => {
      if (val.includes('main')) {
        chainId = 1;
      } else {
        chainId = 3;
      }
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
}

const self = new Session();
export default self;
