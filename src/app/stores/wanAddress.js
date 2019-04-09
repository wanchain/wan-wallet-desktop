
import { observable, action } from 'mobx';

import helper from 'utils/helper';

class WanAddress {
    @observable addrList = [];

    @action updateAddress(newAddr) {
      const len = self.addrList.length;
      self.addrList.push({
        key: `${len + 1}`,
        name: `Account${len + 1}`,
        address: `0x${newAddr.address}`,
        balance: `${newAddr.balance}`
      });
    }
}

const self = new WanAddress();
export default self;
