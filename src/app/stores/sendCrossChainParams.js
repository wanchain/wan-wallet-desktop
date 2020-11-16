import { observable, action, computed } from 'mobx';
import { CROSS_TYPE } from 'utils/settings';
import session from './session';
import { BigNumber } from 'bignumber.js';

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
      toAddr: '',
      txFeeRatio: ''
    };

    @observable gasLimit = GASLIMIT;

    @observable defaultGasPrice = 10;

    @observable minGasPrice = 1;

    @observable currentGasPrice = 10;

    @action addCrossTransTemplate (addr, params = {}) {
      let gasPrice = 1;
      self.currentFrom = addr;
      self.transParams[addr] = {
        gasPrice,
        source: params.chainType,
        destination: params.chainType ? params.chainType : 'WAN',
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
        crossType: params.crossType ? params.crossType : CROSS_TYPE[0],
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

    @computed get btcFee() {
      return session.chainId === 1 ? 0.0001 : 0.001;
    }

    @computed get feeRate() {
      return session.chainId === 1 ? 30 : 300;
    }

    @computed get rawTx() {
      if (Object.keys(this.transParams).length !== 0) {
        let { to, amount, chainId, nonce, gasLimit, gasPrice } = this.transParams[this.currentFrom];
        if (nonce === undefined) {
          return false;
        }
        return {
          to: to,
          value: '0x' + new BigNumber(amount).times(BigNumber(10).pow(18)).toString(16),
          data: '0x',
          chainId: chainId,
          nonce: '0x' + Number(nonce).toString(16),
          gasLimit: '0x' + Number(gasLimit).toString(16),
          gasPrice: '0x' + new BigNumber(gasPrice).times(BigNumber(10).pow(9)).toString(16),
          Txtype: 1
        };
      } else {
        return false;
      }
    }
}

const self = new SendCrossChainParams();
export default self;
