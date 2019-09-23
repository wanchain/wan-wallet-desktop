import keccak from 'keccak';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { WANPATH } from 'utils/settings';
import { fromWei, isNumber } from 'utils/support';

const wanUtil = require('wanchain-util');
let emitterHandlers = {};

export const deserializeWanTx = data => {
  let tx = new wanUtil.wanchainTx(data) // eslint-disable-line
  let from = tx.getSenderAddress();
  return { ...tx.toJSON(true), from: `0x${from.toString('hex')}` };
}

export const checkMaxFeeRate = function (rule, value, callback) {
  try {
    if (!isNumber(value)) {
      callback(intl.get('NormalTransForm.invalidFeeRate'));
      return;
    }
    if (value < 0 || value >= 100) {
      callback(intl.get('NormalTransForm.invalidFeeRate'));
      return;
    }
    if (value.toString().split('.')[1] && value.toString().split('.')[1].length > 2) {
      callback(intl.get('NormalTransForm.invalidFeeRate'));
      return;
    }
    callback();
  } catch (err) {
    callback(intl.get('NormalTransForm.invalidFeeRate'));
  }
}

export const wanPubKey2Address = function (pubKey) {
  let key = Buffer.from(pubKey.toLowerCase().replace('0x', '').substring(2), 'hex');
  let address = keccak('keccak256').update(key).digest().slice(-20).toString('hex');
  return '0x' + address;
}

export const getBalance = function (arr) {
  const addrArr = arr.map(item => item.substr(2));

  return new Promise((resolve, reject) => {
    let thisVal
    wand.request('address_balance', { addr: addrArr }, (err, val) => {
      thisVal = Object.assign({}, val);
      if (err) {
        console.log('Get balance failed ', err)
        return reject(err)
      } else {
        Object.keys(thisVal).forEach(item => {
          thisVal[item] = fromWei(thisVal[item]);
        });
        return resolve(thisVal);
      }
    })
  })
};

export const getBalanceWithPrivateBalance = function (arr, path) {
  const addrArr = arr.map(item => item.substr(2));
  return new Promise((resolve, reject) => {
    let thisVal = {};
    wand.request('address_balances', { addr: addrArr, path: path }, (err, val) => {
      if (err) {
        return reject(err)
      } else {
        thisVal.balance = Object.assign({}, val.balance);
        thisVal.privateBalance = Object.assign({}, val.privateBalance);
        Object.keys(thisVal.balance).forEach(item => {
          thisVal.balance[item] = fromWei(thisVal.balance[item]);
        });

        Object.keys(thisVal.privateBalance).forEach(item => {
          thisVal.privateBalance[item] = fromWei(thisVal.privateBalance[item]);
        });
        return resolve(thisVal);
      }
    });
  });
};

export const getValueByAddrInfo = function (value, type, addrInfo) {
  if (value.indexOf(':') !== -1) {
    let addrArr = value.split(':');
    let addrType = addrArr[0].toLowerCase();
    let addr = addrArr[1].trimStart();
    return addrInfo[addrType][addr] && addrInfo[addrType][addr][type];
  } else {
    if (addrInfo['normal'][value]) {
      switch (type) {
        case 'path':
          return `${WANPATH}${addrInfo['normal'][value][type]}`
        default:
          return addrInfo['normal'][value][type]
      }
    } else {
      return undefined
    }
  }
}

export const getInfoByAddress = function (address, infos, addrInfo) {
  let value;
  Object.keys(addrInfo).forEach(type => {
    let index = Object.keys(addrInfo[type]).findIndex(val => val.toLowerCase() === address);
    if (index !== -1) {
      let addr = Object.keys(addrInfo[type])[index];
      value = { type, addr }
      infos.forEach(item => { value[item] = addrInfo[type][addr][item] });
    }
  });
  return value;
}

export const getNonce = function (addrArr, chainType) {
  return new Promise((resolve, reject) => {
    wand.request('address_getNonce', { addr: addrArr, chainType: chainType }, (err, val) => {
      if (err) {
        console.log('Get nonce failed', err)
        return reject(err);
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
        console.log('Get gas price failed ', err);
        return reject(err)
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
        console.log('Estimate gas failed ', err);
        return reject(err);
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
        console.log('Check WAN address failed ', err);
        return reject(err);
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
        err = 'Check WAN address failed: ' + err
        return reject(err)
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
        err = 'Get chain ID failed:' + err;
        return reject(err);
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
        err = 'Get SDK status failed: ' + err;
        return reject(err);
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
  if (typeof addr === 'string') {
    addr = addr.startsWith('0x') ? addr : `0x${addr}`.toLowerCase();
    Object.keys(addrInfo).forEach(item => {
      let has = Object.keys(addrInfo[item]).find(val => val.toLowerCase() === addr.toLowerCase());
      if (has) {
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
  if (type === 'normal') {
    tmp = Object.assign({}, addrInfo[type], addrInfo['import']);
  } else {
    tmp = Object.assign({}, addrInfo[type]);
  }
  Object.values(tmp).forEach(item => {
    if (item.name === record.name && item.address !== record.address) {
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
  });
  for (let item of Object.values(tmp)) {
    if (item.address === addr) {
      balance = item.balance;
      break;
    }
  }
  return balance;
}

export const getPrivateBalanceByAddr = function (addr, addrInfo) {
  let addrArr = { ...addrInfo.normal, ...addrInfo.import };
  return addrArr[addr] ? addrArr[addr].wbalance : '0';
}

export const checkAmountUnit = function (decimals, amount) {
  if (!Number.isInteger(decimals)) {
    throw new Error('Decimals must be a integer');
  }
  if (amount === '0') {
    return true;
  }
  let decimalLen = amount.toString().length - amount.toString().indexOf('.') - 1;
  return !!(amount >= 1 / (10 ** decimals)) && decimalLen <= decimals;
}

export const formatAmount = function (amount) {
  let amountStr = amount.toString();
  if (amountStr.indexOf('.') === 0) {
    amount = new BigNumber(`0${amount}`);
  }
  if (amountStr.indexOf('.') === amountStr.length - 1) {
    amount = new BigNumber(`${amount}0`);
  }

  return amount.toString();
}

export const getAddrByTypes = function (addrInfo, types) {
  let addrs = [];
  if (types) {
    types.forEach(type => {
      addrs.push(Object.keys(addrInfo[type]));
    })
  } else {
    Object.keys(addrInfo).forEach(type => {
      addrs.push(Object.keys(addrInfo[type]));
    })
  }
  // return [['normal], ['Ledger], ... , ['Trezor]]
  return addrs;
}

export const regEmitterHandler = function (key, callback) {
  emitterHandlers[key] = callback;
}

export const initEmitterHandler = function () {
  wand.emitter.on('notification', function (key, val) {
    console.log('Emitter: ', key, val)
    if (Object.prototype.hasOwnProperty.call(emitterHandlers, key)) {
      emitterHandlers[key](val);
    }
  })
};

export const getContractAddr = function () {
  return new Promise((resolve, reject) => {
    wand.request('staking_getContractAddr', {}, (err, val) => {
      if (err) {
        err = 'staking_getContractAddr failed: ' + err;
        return reject(err);
      } else {
        return resolve(val);
      }
    });
  })
};

export const getContractData = function (func, ...params) {
  return new Promise((resolve, reject) => {
    wand.request('staking_getContractData', { func, params }, (err, val) => {
      if (err) {
        err = 'staking_getContractData failed: ' + err;
        return reject(err);
      } else {
        return resolve(val);
      }
    });
  })
};

export const openScanOTA = function(path) {
  return new Promise((resolve, reject) => {
    wand.request('address_scanMultiOTA', path, function (err, res) {
      if (err) {
        console.log('Open OTA scanner failed:', err);
        return reject(err);
      } else {
        return resolve();
      }
    });
  })
}
