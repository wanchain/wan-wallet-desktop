import Web3 from 'web3';
import keccak from 'keccak';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { WANPATH, DEFAULT_GAS, HASHX, FAKEADDR, FAKESTOREMAN, X, FAKEVAL, MIN_CONFIRM_BLKS, MAX_CONFIRM_BLKS, WALLETID } from 'utils/settings';

import { fromWei, isNumber } from 'utils/support';

const web3 = new Web3();
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

export const getEthBalance = function (arr) {
  const addrArr = arr.map(item => item.substr(2));

  return new Promise((resolve, reject) => {
    let thisVal
    wand.request('address_ethBalance', { ethAddr: addrArr }, (err, val) => {
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
}

export const getBTCMultiBalances = function (addresses) {
  return new Promise((resolve, reject) => {
    wand.request('address_getBtcMultiBalances', { minconf: MIN_CONFIRM_BLKS, maxconf: MAX_CONFIRM_BLKS, addresses }, (err, data) => {
      if (err) {
        console.log('Get BTC UTXO Failed: ', err);
        return reject(err);
      } else {
        return resolve(data);
      }
    })
  })
}

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

export const getSmgList = function (crossChain) {
  return new Promise((resolve, reject) => {
    wand.request('crossChain_getSmgList', { crossChain }, (err, val) => {
      if (err) {
        console.log('Get Smg list failed', err)
        return reject(err);
      } else {
        return resolve(val);
      }
    });
  })
}

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
    wand.request('address_isWanAddress', { address }, (err, val) => {
      if (err) {
        console.log('Check WAN address failed ', err);
        return reject(err);
      } else {
        return resolve(val);
      }
    })
  })
};

export const checkETHAddr = function (address) {
  return new Promise((resolve, reject) => {
    wand.request('address_isEthAddress', { address }, (err, val) => {
      if (err) {
        console.log('Check ETH address failed ', err);
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
  })
  Object.values(tmp).forEach(item => {
    if (item.address === addr) {
      balance = item.balance;
      return; // eslint-disable-line no-useless-return
    }
  })
  return balance;
}

export const getPrivateBalanceByAddr = function (addr, addrInfo) {
  let addrArr = { ...addrInfo.normal, ...addrInfo.import };
  return addrArr[addr] ? addrArr[addr].wbalance : '0';
}

export const checkAmountUnit = function (decimals, amount) {
  if (!Number.isInteger(Number(decimals))) {
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

export const encodeTransferInput = function (addr, decimal, value = 0) {
  const TRANSFER = '0xa9059cbb';
  value = new BigNumber(value).multipliedBy(Math.pow(10, decimal)).toString(10);
  return TRANSFER + web3.eth.abi.encodeParameters(['address', 'uint256'], [addr.slice(2).toLowerCase(), value]).slice(2);
}

export const encodeEth2wethLockInput = function () {
  const LOCK = '0x158e00a3';
  return LOCK + web3.eth.abi.encodeParameters(['bytes32', 'address', 'address'], [HASHX, FAKESTOREMAN, FAKEADDR]).slice(2);
}

export const encodeEth2wethRefundInput = function () {
  const REFUND = '0x2000fe50';
  return REFUND + web3.eth.abi.encodeParameters(['bytes32'], [X]).slice(2);
}

export const encodeWeth2ethLockInput = function () {
  const REFUND = '0x004b4329';
  return REFUND + web3.eth.abi.encodeParameters(['bytes32', 'address', 'address', 'uint'], [HASHX, FAKESTOREMAN, FAKEADDR, FAKEVAL]).slice(2);
}

export const encodeWeth2ethRefundInput = function () {
  const REFUND = '0x514d0b01';
  return REFUND + web3.eth.abi.encodeParameters(['bytes32'], [X]).slice(2);
}

export const estimateCrossETHInboundGas = function (from) {
  return new Promise((resolve, reject) => {
    wand.request('crossChain_getHtmlAddr', null, async (err, ret) => {
      if (err) {
        console.log('estimateCrossChainGas:', err)
        return reject(err);
      } else {
        let ethTrans = {
          from: from,
          to: ret.eth,
          value: new BigNumber('1').multipliedBy(Math.pow(10, 18)).toString(10),
          data: encodeEth2wethLockInput(),
          gas: DEFAULT_GAS
        };
        let wanTrans = {
          from: FAKEADDR,
          to: ret.weth,
          value: '0',
          data: encodeEth2wethRefundInput(),
          gas: DEFAULT_GAS
        };
        try {
          let [ethGas, wanGas] = await Promise.all([estimateGas('ETH', ethTrans), estimateGas('WAN', wanTrans)])
          resolve({
            ETH: ethGas,
            WAN: wanGas
          })
        } catch (err) {
          console.log('estimateCrossETHGas.estimateGas', err)
          reject(err)
        }
      }
    })
  })
}

export const estimateCrossETHOutboundGas = function (from) {
  return new Promise((resolve, reject) => {
    wand.request('crossChain_getHtmlAddr', null, async (err, ret) => {
      if (err) {
        console.log('estimateCrossChainGas:', err)
        return reject(err);
      } else {
        let wanTrans = {
          from: from,
          to: ret.weth,
          value: new BigNumber('1').multipliedBy(Math.pow(10, 18)).toString(10),
          data: encodeWeth2ethLockInput(),
          gas: DEFAULT_GAS
        };
        let ethTrans = {
          from: FAKEADDR,
          to: ret.eth,
          value: '0',
          data: encodeWeth2ethRefundInput(),
          gas: DEFAULT_GAS
        };
        try {
          let [ethGas, wanGas] = await Promise.all([estimateGas('ETH', ethTrans), estimateGas('WAN', wanTrans)])
          resolve({
            WAN: wanGas,
            ETH: ethGas
          })
        } catch (err) {
          console.log('estimateCrossETHGas.estimateGas', err)
          reject(err)
        }
      }
    })
  })
}

export const getAllUndoneCrossTrans = function (callback) {
  wand.request('crossChain_getAllUndoneCrossTrans', null, (err, ret) => {
    if (err) {
      return callback(err);
    } else {
      return callback(null, ret);
    }
  })
}

export const increaseFailedRetryCount = function (params) {
  wand.request('crossChain_increaseFailedRetryCount', params, err => {
    if (err) {
      console.log('Increase redeem retry count failed');
    }
  })
}

export const openScanOTA = function (path) {
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

export const createFirstAddr = function (walletID, chainType, path, name) {
  return new Promise((resolve, reject) => {
    wand.request('address_getOne', { walletID, chainType, path }, (err, val_address_get) => {
      if (!err) {
        let meta = { name, addr: `0x${val_address_get.address}` };
        if (chainType === 'WAN') {
          meta.waddr = `0x${val_address_get.waddress}`.toLowerCase();
        }
        wand.request('account_create', { walletID, path, meta }, (err, val_account_create) => {
          if (!err && val_account_create) {
            let addressInfo;
            if (chainType === 'WAN') {
              addressInfo = {
                start: 0,
                address: wanUtil.toChecksumAddress(`0x${val_address_get.address}`),
                waddress: (`0x${val_address_get.waddress}`)
              }

              // Scan new account
              openScanOTA([[1, path]]);
            } else {
              addressInfo = {
                start: 0,
                address: `0x${val_address_get.address}`
              }
            }
            resolve(addressInfo);
          } else {
            reject(err);
          }
        });
      }
    });
  })
}

export const createBTCAddr = function (btcPath, addrLen) {
  let path = `${btcPath}${addrLen}`;
  return new Promise((resolve, reject) => {
    wand.request('address_getOne', { walletID: WALLETID.NATIVE, chainType: 'BTC', path }, (err_getOne, val_address_get) => {
      if (!err_getOne) {
        wand.request('address_btcImportAddress', { address: val_address_get.address }, (err_btcImportAddress, data) => {
          if (!err_btcImportAddress) {
            wand.request('account_create', { walletID: WALLETID.NATIVE, path: path, meta: { name: `BTC-Account${addrLen + 1}`, addr: val_address_get.address } }, (err, val_account_create) => {
              if (!err && val_account_create) {
                return resolve({
                  start: addrLen,
                  address: val_address_get.address
                });
              } else {
                return reject(err);
              }
            });
          } else {
            return reject(err_btcImportAddress);
          }
        });
      } else {
        return reject(err_getOne);
      }
    });
  })
}
