import { observable, action } from 'mobx';
import { getChainId } from 'utils/helper';

class Session {
  @observable hasMnemonicOrNot = false;
  @observable chainId = 1;
  @observable auth = false;
  @observable settings = {
    reinput_pwd: false,
    staking_advance: false,
  };

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

  @action initChainId() {
    getChainId().then((chainId) => {
      self.chainId = chainId;
      console.log('Chain ID:', chainId);
    });
  }

  @action setMnemonicStatus(status) {
    self.hasMnemonicOrNot = status;
  }

  @action setAuth(val) {
    self.auth = val;
  }

  @action initSettings() {
    wand.request('setting_get', { keys: ['settings'] }, (err, ret) => {
      if(err) {
        console.log(`err: ${JSON.stringify(err)}`);
        return;
      };
      self.settings = ret[0];
      console.log('Setting:', self.settings);
    })
  }

  @action updateSettings(newValue) {
    let obj = self.settings;
    wand.request('setting_set', { settings: newValue }, (err, ret) => {
      if(err) return;
      if(ret) {
        self.settings = Object.assign(obj, newValue);
      }
    })
  }
}

const self = new Session();
export default self;
