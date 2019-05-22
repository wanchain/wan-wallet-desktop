import { observable, action } from 'mobx';
import { regEmitterHandler, getChainId } from 'utils/helper';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;
  @observable chainId = 1;
  @observable auth = false;
  @observable language = 'en_US';

  @action setChainId(id) {
    self.chainId = id;
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

  @action initChainId(callback) {
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
}

const self = new Session();
export default self;
