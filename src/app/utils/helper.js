import { fromWei } from 'utils/support';
import { BigNumber } from 'bignumber.js';

const WAN = "m/44'/5718350'/0'/0/";
let emitterHandlers = {};

export const getBalance = function (arr) {
  const addrArr = arr.map(item => item.substr(2));

  return new Promise((resolve, reject) => {
    let thisVal
    wand.request('address_balance', { addr: addrArr }, (err, val) => {
      thisVal = Object.assign({}, val);
      if (err) {
        return reject('Get balance failed ', err)
      } else {
        Object.keys(thisVal).forEach(item => {
          return thisVal[item] = fromWei(thisVal[item])
        });
        return resolve(thisVal);
      }
    })
  })
};

export const getValueByAddrInfo = function (value, type, addrInfo) {
  if(value.indexOf(':') !== -1) {
    let addrArr = value.split(':');
    let addrType = addrArr[0].toLowerCase();
    let addr = addrArr[1].trimStart();
    return addrInfo[addrType][addr] && addrInfo[addrType][addr][type];
  } else {
    if(addrInfo['normal'][value]) {
      switch(type) {
        case 'path':
          return `${WAN}${addrInfo['normal'][value][type]}`
        default:
          return addrInfo['normal'][value][type]
      } 
    } else {
      return undefined
    }
  }
}

export const getInfoByAddress = function(address, infos, addrInfo) {
  let value;
  Object.keys(addrInfo).forEach(type => {
    let index = Object.keys(addrInfo[type]).findIndex(val => val.toLowerCase() === address);
    if(index !== -1) {
      let addr = Object.keys(addrInfo[type])[index];
      value = { type, addr }
      infos.forEach(item => value[item] = addrInfo[type][addr][item]);
    }
  });
  return value;
}

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

export const estimateGas = function (chainType, tx) {
  return new Promise((resolve, reject) => {
    wand.request('transaction_estimateGas', { chainType: chainType, tx: tx }, (err, val) => {
      if (err) {
        return reject('Estimate gas failed ', err)
      } else {
        return resolve(val);
      }
    })
  })
};

export const checkWanAddr = function (address) {
  return new Promise((resolve, reject) => {
    wand.request('address_isWanAddress', { address: address }, (err, val) => {
      if (err) {
        return reject('Check WAN address failed ', err)
      } else {
        return resolve(val);
      }
    })
  })
};

export const checkWanValidatorAddr = function (address) {
  return new Promise((resolve, reject) => {
    wand.request('address_isValidatorAddress', { address: address }, (err, val) => {
      if (err) {
        return reject('Check WAN address failed ', err)
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
        return reject('Get chain ID failed', err);
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

export const isSdkReady = function () {
  return new Promise((resolve, reject) => {
    wand.request('query_config', {
      param: 'sdkStatus'
    }, function (err, val) {
      if (err) {
        return reject('Get SDK status failed ', err);
      } else {
        if (val['sdkStatus'].includes('ready')) {
          return resolve(true);
        } else {
          return resolve(false);
        }
      }
    });
  });
};

export const checkAddrType = function (addr, addrInfo) {
  let type = false;
  if(typeof addr === 'string') {
    addr = addr.startsWith('0x') ? addr : `0x${addr}`.toLowerCase();
    Object.keys(addrInfo).forEach(item => {
      let has = Object.keys(addrInfo[item]).find(val => val.toLowerCase() === addr.toLowerCase());
      if(has) {
        type = item;
        return type;
      }
    })
    return type
  }
}

export const hasSameName = function (type, record, addrInfo) {
  let tmp;
  let bool = false;
  if(type === 'normal') {
    tmp = Object.assign({}, addrInfo[type], addrInfo['import']);
  } else {
    tmp = Object.assign({}, addrInfo[type]);
  }
  Object.values(tmp).forEach(item => {
    if(item.name === record.name && item.address !== record.address) {
      bool = true;
    }
  })
  return bool;
}

export const getBalanceByAddr = function (addr, addrInfo) {
  let balance = 0;
  let tmp = {};
  Object.keys(addrInfo).forEach(item => {
    tmp = Object.assign(tmp, addrInfo[item])
  })
  Object.values(tmp).forEach(item => {
    if(item.address === addr) {
      balance = item.balance;
      return;
    }
  })
  return balance;
}

export const checkAmountUnit = function (decimals, amount) {
  if(!Number.isInteger(decimals)) {
    throw new Error('Decimals must be a integer');
  }
  let decimalLen = amount.toString().length - amount.toString().indexOf('.') - 1;
  return !!(amount >= 1 / (10 ** decimals)) && decimalLen <= decimals;
}

export const formatAmount = function (amount) {
  let amountStr = amount.toString();
  if(amountStr.indexOf('.') === 0) {
    amount = new BigNumber(`0${amount}`);
  }
  if(amountStr.indexOf('.') === amountStr.length - 1) {
    amount = new BigNumber(`${amount}0`);
  }
  
  return amount.toString();
}

export const getAddrByTypes = function (addrInfo, types) {
  let addrs = [];
  if(types) {
    types.forEach(type => {
      addrs.push(Object.keys(addrInfo[type]));
    })
  } else {
    Object.keys(addrInfo).forEach(type => {
      addrs.push(Object.keys(addrInfo[type]));
    })
  }
  // return [['normal], ['Ledger], ... , ['Trzeor]]
  return addrs;
}

export const regEmitterHandler = function (key, callback) {
  emitterHandlers[key] = callback;
}

export const initEmitterHandler = function () {
  wand.emitter.on('notification', function (key, val) {
    console.log('Emitter: ', key, val)
    if (emitterHandlers.hasOwnProperty(key)) {
      emitterHandlers[key](val);
    }
  })
};

export const getContractAddr = function () {
  return new Promise((resolve, reject) => {
    wand.request('staking_getContractAddr', {}, (err, val) => {
      if (err) {
        return reject('staking_getContractAddr failed', err);
      } else {
        return resolve(val);
      }
    });
  })
};

export const getContractData = function (func, validatorAddr) {
  return new Promise((resolve, reject) => {
    wand.request('staking_getContractData', {func, validatorAddr}, (err, val) => {
      if (err) {
        return reject('staking_getContractData failed', err);
      } else {
        return resolve(val);
      }
    });
  })
};

