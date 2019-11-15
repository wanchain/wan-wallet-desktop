import { observable, action, computed, toJS } from 'mobx';

import session from './session';

const GASLIMIT = 21000;

class SendCrossChainParams {
    @observable currentFrom = '';

    @observable transParams = {};

    @observable BTCCrossTransParams = {
      from: [],
      changeAddress: '',
      to: '',
      value: 0,
      feeRate: 0,
      smgBtcAddr: '',
      btcAddress: '',
      storeman: '',
      wanAddress: '',
      gasPrice: '',
      gas: '',
      crossAddr: '',
      amount: 0,
      toAddr: ''
    };

    @observable gasLimit = GASLIMIT;

    @observable defaultGasPrice = 200;

    @observable minGasPrice = 180;

    @observable currentGasPrice = 200;

    @action addCrossTransTemplate (addr, params = {}) {
      let gasPrice = params.chainType === 'ETH' ? 1 : 200;
      self.currentFrom = addr;
      self.transParams[addr] = {
        gasPrice,
        source: params.chainType,
        destination: params.chainType === 'ETH' ? 'ETH' : 'WAN',
        from: {
          walletID: 1,
          path: params.path
        },
        to: {
          walletID: 1,
          path: ''
        },
        toAddr: '',
        amount: 0,
        storeman: '',
        txFeeRatio: 0,
        gasLimit: GASLIMIT,
      };
    }

    @action updateBTCTransParams (paramsObj) {
      Object.keys(paramsObj).forEach(item => {
        self.BTCCrossTransParams[item] = paramsObj[item];
      });
    }

    @action updateTransParams (addr, paramsObj) {
      Object.keys(paramsObj).forEach(item => {
        if (item === 'gasPrice') {
          self.transParams[addr].gasPrice = Math.max(paramsObj.gasPrice, self.transParams[addr].gasPrice)
        } else {
          self.transParams[addr][item] = paramsObj[item];
        }
      });
    }

    @computed get minCrossBTC() {
      return session.chainId === 1 ? 0.0002 : 0.002;
    }
}

const self = new SendCrossChainParams();
export default self;
