import { fromWei } from 'utils/support';
import { BigNumber } from 'bignumber.js';

let emitterHandlers = {};

export const getBalance = function (addrArr) {
  return new Promise((resolve, reject) => {
    wand.request('address_balance', { addr: addrArr }, (err, val) => {
      if (err) {
        return reject('Get balance failed ', err)
      } else {
        Object.keys(val).forEach(item => val[item] = fromWei(val[item]));
        return resolve(val);
      }
    })
  })
};

export const getNonce = function (addrArr, chainType) {
  return new Promise((resolve, reject) => {
    wand.request('address_getNonce', { addr: addrArr, chainType: chainType }, (err, val) => {
      if (err) {
        return reject('Get nonce failed', err);
      } else {
        let nonce = parseInt(val, 16);
        return resolve(nonce);
      }
    });
  })
};

export const getGasPrice = function (chainType) {
  return new Promise((resolve, reject) => {
    wand.request('query_getGasPrice', { chainType: chainType }, (err, val) => {
      if (err) {
        return reject('Get gas price failed ', err)
      } else {
        let gasPrice = new BigNumber(val).div(BigNumber(10).pow(9)).toString(10);
        return resolve(gasPrice);
      }
    })
  })
};

export const getGasLimit = function (chainType) {
  return new Promise((resolve, reject) => {
    wand.request('query_getGasLimit', { chainType: chainType }, (err, val) => {
      if (err) {
        return reject('Get gas limit failed ', err)
      } else {
        return resolve(val);
      }
    })
  })
};

export const getChainId = function () {
  return new Promise((resolve, reject) => {
    wand.request('query_config', {
      param: 'network'
    }, function (err, val) {
      if (err) {
        return reject('Get chain ID failed ', err);
      } else {
        if (val['network'].includes('main')) {
          return resolve(1);
        } else {
          return resolve(3);
        }
      }
    });
  });
};

export const regEmitterHandler = function (key, callback) {
  emitterHandlers[key] = callback;
}

export const initEmitterHandler = function () {
  wand.emitter.on('notification', function (key, val) {
    console.log(key, val);
    if (emitterHandlers.hasOwnProperty(key)) {
      emitterHandlers[key](val);
    }
  })
};