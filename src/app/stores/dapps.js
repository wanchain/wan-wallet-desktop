import { observable, action, computed, toJS } from 'mobx';

import tokens from './tokens';
import session from './session';
import { timeFormat, fromWei, formatNum, formatNumByDecimals, isSameString } from 'utils/support';

class DApps {
  constructor() {
    this.dappList = this.getLocalDApps();
  }

  @observable dappList = [];

  @computed get dAppsOnSideBar() {
    let list = [];
    if (!(self.dappList instanceof Object)) {
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
    // return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return list;
  }

  @action addCustomDApp(dappInfo) {
    self.dappList = self.getLocalDApps();
    if (!self.dappList) {
      self.dappList = [];
    }
    self.dappList.push({
      name: dappInfo.name,
      icon: dappInfo.icon,
      url: dappInfo.url,
      commit: dappInfo.commit,
      enable: true,
    });
    self.setLocalDApps(self.dappList);
  }

  @action delDApp(index) {
    self.dappList = self.getLocalDApps();
    self.dappList.splice(index, 1);
    self.setLocalDApps(self.dappList);
  }

  @action getDappsInfo() {
    self.dappList = self.getLocalDApps();
    return self.dappList;
  }

  @action switchDApp(name, enable) {
    self.dappList = self.getLocalDApps();
    for (let i = 0; i < self.dappList.length; i++) {
      if (name === self.dappList[i].name) {
        self.dappList[i].enable = enable;
      }
    }
    self.setLocalDApps(self.dappList);
  }

  getLocalDApps() {
    let ret = window.localStorage.getItem('dapps');
    if (ret) {
      let obj = JSON.parse(ret);
      return obj;
    }
    return undefined;
  }

  setLocalDApps(obj) {
    if (obj) {
      let str = JSON.stringify(obj);
      window.localStorage.setItem('dapps', str);
    }
  }
}

const self = new DApps();
export default self;
