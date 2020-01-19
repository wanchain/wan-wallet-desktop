import { observable, action, toJS } from 'mobx';

class DeployContract {
  @observable contractOwnerPath = {};

  @observable registerTokenPath = {};

  @observable sgAddrPath = {};

  @observable upgradeAddrPath = {};

  @observable upgradeComponents = [];

  @action setContractOwnerPath(val) {
    self.contractOwnerPath = val;
  }

  @action setRegisterTokenPath(val) {
    self.registerTokenPath = val;
  }

  @action setSgAddrPath(val) {
    self.sgAddrPath = val;
  }

  @action setUpgradeAddrPath(val) {
    self.upgradeAddrPath = val;
  }

  @action setUpgradeComponents(val) {
    self.upgradeComponents = val;
  }
}

const self = new DeployContract();
export default self;
