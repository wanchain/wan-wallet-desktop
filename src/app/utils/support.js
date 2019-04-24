export function accumulator(promise, func) {
  return promise.then(result => {
    return func().then(Array.prototype.concat.bind(result));
  });
};

export function getBalanceObj(arr) {
  let newArr = {};
  arr.forEach((item) => {
    let key = Object.keys(item);
    newArr[key] = item[key];
  });
  return newArr;
}

export function fromWei(data) {
  return data / Math.pow(10, 18);
}

