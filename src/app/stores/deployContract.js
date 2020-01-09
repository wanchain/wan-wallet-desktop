import { observable, action, toJS } from 'mobx';
import { getChainId } from 'utils/helper';

class DeployContract {
  @observable hasMnemonicOrNot = false;

  // 1 for main net, 3 for test net
  @observable contractOwnerPath = {};

  @observable sgAddrPath = {};

  @action setContractOwnerPath(val) {
    self.contractOwnerPath = val;
  }

  @action setSgAddrPath(val) {
    self.sgAddrPath = val;
  }
}

const self = new DeployContract();
export default self;
