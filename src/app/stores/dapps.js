import { observable, action, computed, autorun, toJS } from 'mobx';

import session from './session';
import languageIntl from './languageIntl';
import { ALLCATEGORIES } from 'utils/settings';
import localDapps from 'localDapps';

class DApps {
  @observable dappList = [];

  @observable allDapps = [];

  @observable showDisclaimer = true;

  @observable currentDappInfo;

  @computed get dAppsOnSideBar() {
    let list = [];

    if (!self.currentDappInfo) {
      return [];
    }
    Object.keys(self.dappList).forEach(item => {
      let val = self.dappList[item];
      if (val.enable) {
        list.push({
          name: val.name,
          icon: val.icon,
          url: val.url,
          commit: val.commit,
        })
      }
    });
    return list;
  }

  @computed get formatedDApp() {
    let language = languageIntl.language.split('_')[0];
    return languageIntl.language && self.allDapps.map(item => {
      let info = item.langInfo.find(val => val.language === language);
      if (!info) {
        info = item.langInfo.find(val => val.language === 'en');
      }
      return Object.assign({}, item, info);
    })
  }

  @action updateDApps(options) {
    let language = options.language.split('_')[0];
    options.language = options.language !== 'en_US' ? [language, 'en'] : [language]
    wand.request('dappStore_getRegisteredDapp', { options }, (err, val) => {
      if (!err) {
        if (session.chainId === 1) {
          self.allDapps = val.concat(localDapps);
        } else {
          self.allDapps = val;
        }
      } else {
        console.log(`Get Registered DApps failed`, err)
      }
    })
  }

  @computed get dAppTypes() {
    let types = new Set();
    self.allDapps.forEach(item => types.add(`DApp.${item.type}`));
    return [...types, ALLCATEGORIES];
  }

  @action setShowDisclaimer() {
    self.showDisclaimer = false;
  }

  @action addCustomDApp(dappInfo) {
    self.currentDappInfo = dappInfo;
    if (!self.dappList) {
      self.dappList = [];
    }

    for (let i = 0; i < self.dappList.length; i++) {
      if (self.dappList[i].name === dappInfo.name || self.dappList[i].url === dappInfo.url) {
        return false;
      }
    }
    self.dappList.push({
      name: dappInfo.name,
      // icon: dappInfo.icon,
      url: dappInfo.url,
      commit: dappInfo.commit,
      enable: true,
      local: dappInfo.local
    });
    self.setLocalDApps(self.dappList);
    return true;
  }

  @action delDApp(index) {
    self.dappList.splice(index, 1);
    self.setLocalDApps(self.dappList);
  }

  @action getDappsInfo() {
    if (!self.dappList) {
      self.dappList = [];
    }
    return self.dappList;
  }

  @action switchDApp(name, enable) {
    for (let i = 0; i < self.dappList.length; i++) {
      if (name === self.dappList[i].name) {
        self.dappList[i].enable = enable;
      }
    }
    self.setLocalDApps(self.dappList);
  }

  @action updateLocalDApps() {
    wand.request('setting_getDapps', {}, (err, val) => {
      if (err) {
        console.log(`Get Registered DApps failed`, err);
      } else if (val) {
        self.dappList = val;
        if (val.length > 0) {
          self.currentDappInfo = val[0];
        }
      }
    })
  }

  setLocalDApps(obj) {
    if (obj) {
      wand.request('setting_updateDapps', obj, function (err, val) {
        if (err) {
          console.log('setLocalDApps', err);
        }
      });
    }
  }
}

const self = new DApps();

autorun(() => {
  self.updateDApps({ chainTyps: 'WAN', language: languageIntl.language });
});

export default self;
