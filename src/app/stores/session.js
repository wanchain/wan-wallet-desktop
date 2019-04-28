import { observable, action } from 'mobx';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;

  @action getMnemonic() {
    return new Promise((resolve, reject) =>{
      wand.request('phrase_has', null, function(err, val) {
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

  @action setMnemonicStatus(status) {
    self.hasMnemonicOrNot = status;
  }

  @action changeTitle(newTitle) {
    self.pageTitle = newTitle;
  }
}

const self = new Session();
export default self;
