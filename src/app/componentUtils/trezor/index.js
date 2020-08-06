import { message } from 'antd';
import intl from 'react-intl-universal';
import TrezorConnect from 'trezor-connect';

import { toWei } from 'utils/support.js';
import { getNonce, getGasPrice, getChainId, getContractAddr, getStoremanContractData } from 'utils/helper';

const pu = require('promisefy-util');
const WanTx = require('wanchainjs-tx');

export const signTransaction = (path, tx, callback) => {
  TrezorConnect.ethereumSignTransaction({
    path: path,
    transaction: {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      chainId: tx.chainId,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      txType: tx.Txtype
    }
  }).then((result) => {
    if (!result.success) {
      message.warn(intl.get('Trezor.signTransactionFailed'));
      callback(intl.get('Trezor.signFailed'), null);
      return;
    }

    tx.v = result.payload.v;
    tx.r = result.payload.r;
    tx.s = result.payload.s;
    let eTx = new WanTx(tx);
    let signedTx = '0x' + eTx.serialize().toString('hex');
    console.log('Signed transaction: ', signedTx);
    callback(null, signedTx);
  }).catch(err => callback(err));
}

export const getPublicKey = callback => {
  TrezorConnect.getPublicKey({
    path: WAN_PATH
  }).then(result => {
    if (result.success) {
      callback(null, result.payload);
    }
  }).catch(error => {
    callback(error, {})
  });
}

export const signPersonalMessage = async (path, message) => {
  let bHex = false;
  if (message.indexOf('0x') !== -1) {
    bHex = true;
    message = message.slice(2);
  }

  const result = await TrezorConnect.ethereumSignMessage({ path, message: message, hex: bHex });
  if (!result.success) {
    throw new Error('Signature failed!');
  }
  return '0x' + result.payload.signature;
}

export const getAddresses = async (basePath, from, count) => {
  let bundle = [];
  for (let i = from; i < from + count; i++) {
    const path = basePath + '/' + i.toString();
    bundle.push({ path: path, showOnTrezor: false });
  }
  if (bundle.length > 0) {
    const bundleResult = await TrezorConnect.ethereumGetAddress({
      bundle: bundle
    });
    if (!bundleResult.success) {
      throw new Error('Get address failed!');
    }

    return bundleResult;
  }
  return null;
}

export const OsmTrezorTrans = async (path, from, value, action, satellite, abiParams) => {
  try {
    let { chainId, nonce, gasPrice, data, cscContractAddr } = await Promise.all([getChainId(), getNonce(from, 'wan'), getGasPrice('wan'), getStoremanContractData(action, ...abiParams), getContractAddr()])
    let rawTx = {
      data,
      from,
      chainId,
      Txtype: 1,
      value: toWei(value),
      to: cscContractAddr,
      nonce: '0x' + nonce.toString(16),
      gasPrice: toWei(gasPrice, 'gwei'),
      gasLimit: '0x' + Number(200000).toString(16),
    };

    let raw = await pu.promisefy(signTransaction, [path, rawTx], this);// Trezor sign
    // Send register validator
    let txHash = await pu.promisefy(wand.request, ['transaction_raw', { raw, chainType: 'WAN' }], this);
    let params = {
      txHash,
      from: from.toLowerCase(),
      to: rawTx.to,
      value: rawTx.value,
      gasPrice: rawTx.gasPrice,
      gasLimit: rawTx.gasLimit,
      nonce: rawTx.nonce,
      srcSCAddrKey: 'WAN',
      srcChainType: 'WAN',
      tokenSymbol: 'WAN',
      status: 'Sending',
    };
    // save register validator history into DB
    await pu.promisefy(wand.request, ['storeman_insertStoremanTransToDB', { tx: params, satellite }], this);
    return Promise.resolve();
  } catch (error) {
    console.log(error);
    message.error(intl.get('ValidatorRegister.registerFailed'));
    return Promise.reject(error);
  }
}
