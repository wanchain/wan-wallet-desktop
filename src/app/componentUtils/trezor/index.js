import intl from 'react-intl-universal';
import TrezorConnect from 'trezor-connect';
import { message } from 'antd';

const WanTx = require('wanchainjs-tx');

export const WAN_PATH = "m/44'/5718350'/0'/0";

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
