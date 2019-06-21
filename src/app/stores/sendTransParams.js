import { observable, action, computed, toJS } from 'mobx';
import BigNumber from 'bignumber.js';

class SendTransParams {
    @observable currentFrom = '';
    @observable transParams = {};
    @observable gasLimit = '21000';
    @observable defaultGasPrice = 200;
    @observable minGasPrice = 180;
    @observable currentGasPrice = 200;
    
    @action addTransTemplate(addr, params) {
      let objKey = { writable: true, enumerable:true };
      self.currentFrom = addr;
      self.transParams[addr] = Object.defineProperties({}, {
        chainType: { value: params.chainType, ...objKey },
        gasPrice: { value: self.minGasPrice, ...objKey },
        gasLimit: { value: self.gasLimit, ...objKey },
        nonce: { value: '', ...objKey } ,
        data: { value: '0x', ...objKey },
        chainId: { value: params.chainId, ...objKey },
        txType: { value: 1, ...objKey },
        path: { value: '', ...objKey },
        to: { value: '', ...objKey },
        amount: { value: 0, ...objKey }
      });
    }

    @action updateGasPrice(gasPrice) {
        self.currentGasPrice = gasPrice;
    }

    @action updateTransParams(addr, paramsObj) {
      Object.keys(paramsObj).forEach(item => {
        self.transParams[addr][item] = paramsObj[item];
      });
    }

    @computed get maxGasPrice() {
      return self.currentGasPrice * 2;
    }

    @computed get averageGasPrice() {
      return Math.max(self.minGasPrice, self.currentGasPrice);
    }

    @computed get gasFeeArr() {
      let minFee = new BigNumber(self.minGasPrice).times(self.gasLimit).div(BigNumber(10).pow(9));
      let averageFee = new BigNumber(self.averageGasPrice).times(self.gasLimit).div(BigNumber(10).pow(9));
      return {
        minFee: minFee.toString(10),
        averageFee: averageFee.toString(10),
        maxFee: averageFee.times(2).toString(10)
      }
    }

    @computed get rawTx() {
      if(Object.keys(self.transParams).length !== 0) {
        let from = self.currentFrom;
        let { to, amount, data, chainId, nonce, gasLimit, gasPrice, txType } = self.transParams[from];
        return {
          to: to,
          value: '0x' + new BigNumber(amount).times(BigNumber(10).pow(18)).toString(16),
          data: data,
          chainId: chainId,
          nonce: '0x' + nonce.toString(16),
          gasLimit: '0x' + gasLimit.toString(16),
          gasPrice: '0x' + new BigNumber(gasPrice).times(BigNumber(10).pow(9)).toString(16),
          Txtype: txType
        };
      } else {
        return {}
      }
    }
}

const self = new SendTransParams();
export default self;
