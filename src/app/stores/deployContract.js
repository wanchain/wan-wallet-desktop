import { observable, action, toJS } from 'mobx';
import { getChainId } from 'utils/helper';

class DeployContract {
  @observable hasMnemonicOrNot = false;

  // 1 for main net, 3 for test net
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
