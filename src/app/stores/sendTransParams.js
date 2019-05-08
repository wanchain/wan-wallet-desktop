
import { observable, action, computed } from 'mobx';

class SendTransParams {
    @observable transParams = {};

    @action addTransaction(addr, params) {
        self.transParams[addr] = params;
    }

    @action updateGasPrice(addr, gasPrice) {
        self.transParams[addr].gasPrice = gasPrice;
    }

    @action updateGasLimit(addr, gasLimit) {
        self.transParams[addr].gasLimit = gasLimit;
    }

    @action updateNonce(addr, nonce) {
        self.transParams[addr].nonce = nonce;
    }

    @action updateAmount(addr, amount) {
        self.transParams[addr].amount = amount;
    }

    @action updateTo(addr, to) {
        self.transParams[addr].to = to;
    }

    @action updateData(addr, data) {
        self.transParams[addr].data = data;
    }

    @action updateChainId(addr, chainId) {
        self.transParams[addr].chainId = chainId;
    }

    @action updateTxType(addr, txType) {
        self.transParams[addr].txType = txType;
    }

    @action updatePath(addr, path) {
        self.transParams[addr].path = path;
    }
}

const self = new SendTransParams();
export default self;
