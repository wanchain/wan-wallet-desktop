
import { observable, action, computed } from 'mobx';

import { getBalanceObj } from 'utils/support';

class WanAddress {
    @observable addrInfo = {};

    @action addAddress(newAddr) {
      const addrLen = Object.keys(self.addrInfo).length;
      self.addrInfo[`0x${newAddr.address}`] = {
        name: `Account${addrLen + 1}`,
        balance: `${newAddr.balance}`
      };
    }

    @action updateBalance(arr) {
      let balaObj = getBalanceObj(arr);
      let keys = Object.keys(balaObj);
      keys.forEach((item) => {
        if(self.addrInfo[item].balance !== balaObj[item]) {
          self.addrInfo[item].balance = balaObj[item]
        }
      })
    }

    @computed get getAddrList() {
      let addrList = [];
      Object.keys(self.addrInfo).forEach((item, index) => {
        addrList.push({
          key: `${index + 1}`,
          name: self.addrInfo[item].name,
          address: item,
          balance: self.addrInfo[item].balance
        });
      });
      return addrList;
    }
}

const self = new WanAddress();
export default self;
