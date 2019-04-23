export const getBalance = function (address) {
  return new Promise((resolve, reject) => {
    wand.request('address_balance', {
      addr: address.substr(2)
    }, (err, val) => {
      if (err) {
        return reject('error printed inside callback: ', err)
      } else {
        return resolve(val);
      }
    })
  })
};