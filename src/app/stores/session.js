import { observable, action } from 'mobx';

class Session {
  @observable pageTitle = 'Wanchain Wallet';
  @observable hasMnemonicOrNot = false;

  @action getMnemonic() {
    wand.request('phrase_has', null, function(err, val) {
      if (!err) {
        self.hasMnemonicOrNot = val
      } else {
        self.hasMnemonicOrNot = false;
      }
    }.bind(this));
  }

  @action changeTitle(newTitle) {
    self.pageTitle = newTitle;
  }
}

const self = new Session();
export default self;
