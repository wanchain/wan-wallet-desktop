import { fromWei } from 'utils/support';

export const getBalance = function (addrArr) {
  return new Promise((resolve, reject) => {
    wand.request('address_balance', {addr: addrArr}, (err, val) => {
      if (err) {
        return reject('error printed inside callback: ', err)
      } else {
        Object.keys(val).forEach(item => val[item] = fromWei(val[item]));
        return resolve(val);
      }
    })
  })
};