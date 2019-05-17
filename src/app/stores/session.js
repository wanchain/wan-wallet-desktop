import { observable, action } from 'mobx';
import { regEmitterHandler, getChainId } from 'utils/helper';
import { observer, inject } from 'mobx-react';


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

  @action initChainId(callback) {
    let chainId;
    getChainId().then((chainId) => {
      self.chainId = chainId;
    });
    regEmitterHandler('network', (val) => {
      if (val.includes('main')) {
        chainId = 1;
      } else {
        chainId = 3;
      }
      self.chainId = chainId;
      wand.request('wallet_lock', null, (err, val) => {
        if (err) { 
            console.log('Lock failed ', err)
            return
        }
        self.setAuth(false);
      })
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
