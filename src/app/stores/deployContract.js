import { observable, action, toJS } from 'mobx';

class DeployContract {
  @observable contractOwnerPath = {};

  @observable registerTokenPath = {};

  @observable sgAddrPath = {};

  @action setContractOwnerPath(val) {
    self.contractOwnerPath = val;
  }

  @action setRegisterTokenPath(val) {
    self.registerTokenPath = val;
  }

  @action setSgAddrPath(val) {
    self.sgAddrPath = val;
  }
}

const self = new DeployContract();
export default self;
