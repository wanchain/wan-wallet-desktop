import { observable, action, computed, toJS } from 'mobx';

class DApps {
  constructor() {
    this.dappList = this.getLocalDApps();
  }

  @observable dappList = [];

  @observable allDapps = [];

  @observable showDisclaimer = true;

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

  @action updateDApps(options) {
    wand.request('dappStore_getRegisteredDapp', { options }, (err, val) => {
      if (!err && val.length !== 0) {
        let Obj = Object.assign({}, val[0])
        Obj.type = 'Finance'
        Obj.name = 'Zinance Game'
        Obj.updatedAt = 1584607432212
        self.allDapps = [val[0], val[0], val[0], val[0], Obj];
      } else {
        console.log(`Get Registered Dapp failed`, err)
      }
    })
  }

  @computed get dAppTypes() {
    let types = new Set();
    self.allDapps.forEach(item => types.add(item.type));
    return [...types, 'DApp.allCategories'];
  }

  @action setShowDisclaimer() {
    self.showDisclaimer = false;
  }

  @action addCustomDApp(dappInfo) {
    self.dappList = self.getLocalDApps();
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
      icon: dappInfo.icon,
      url: dappInfo.url,
      commit: dappInfo.commit,
      enable: true,
    });
    self.setLocalDApps(self.dappList);
    return true;
  }

  @action delDApp(index) {
    self.dappList = self.getLocalDApps();
    self.dappList.splice(index, 1);
    self.setLocalDApps(self.dappList);
  }

  @action getDappsInfo() {
    self.dappList = self.getLocalDApps();
    if (!self.dappList) {
      self.dappList = [];
    }
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
