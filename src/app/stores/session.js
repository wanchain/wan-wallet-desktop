import { observable, action, toJS } from 'mobx';
import { getChainId } from 'utils/helper';

class Session {
  @observable hasMnemonicOrNot = false;

  // 1 for main net, 3 for test net
  @observable chainId = 1;

  @observable auth = false;

  @observable settings = {
    reinput_pwd: false,
    staking_advance: false,
    logout_timeout: '5',
  };

  @action setChainId (id) {
    self.chainId = id;
  }

  @action getMnemonic () {
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

  @action initChainId () {
    return getChainId().then((chainId) => {
      self.chainId = chainId;
      console.log('Chain ID:', chainId);
      return chainId;
    });
  }

  @action setMnemonicStatus (status) {
    self.hasMnemonicOrNot = status;
  }

  @action setAuth (val) {
    self.auth = val;
  }

  @action initSettings () {
    wand.request('setting_get', { keys: ['settings'] }, (err, ret) => {
      if (err) {
        console.log(`Init setting failed: ${JSON.stringify(err)}`);
        return;
      };
      self.settings = ret[0];
    })
  }

  @action updateSettings (newValue) {
    wand.request('setting_set', { settings: newValue }, (err, ret) => {
      if (err) return;
      if (ret) {
        Object.assign(self.settings, newValue);
      }
    })
  }
}

const self = new Session();
export default self;
