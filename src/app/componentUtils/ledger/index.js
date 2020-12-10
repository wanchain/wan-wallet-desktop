import { message } from 'antd';
import intl from 'react-intl-universal';
import { WanRawTx } from 'utils/hardwareUtils'
import { WALLETID } from 'utils/settings';

const pu = require('promisefy-util');
const WanTx = require('wanchainjs-tx');

export const WAN_PATH = "m/44'/5718350'/0'/0";
export const signTransaction = (path, tx, callback) => {
  let rawTx = new WanRawTx(tx).serialize();
  message.info(intl.get('Ledger.signTransactionInLedger'));
  wand.request('wallet_signTransaction', { walletID: WALLETID.LEDGER, path: path, rawTx: rawTx }, (err, sig) => {
    // console.log('wallet_signTransaction:', err, sig)
    if (err) {
      message.warn(intl.get('Ledger.signTransactionFailed'));
      callback(err, null);
      console.log(`Sign Failed: ${err}`);
    } else {
      tx.v = sig.v;
      tx.r = sig.r;
      tx.s = sig.s;
      let wTx = new WanTx(tx);
      let signedTx = '0x' + wTx.serialize().toString('hex');
      callback(null, signedTx);
    }
  });
}
