import Web3 from 'web3';
import { BigNumber } from 'bignumber.js';

const web3 = new Web3();

export function fromWei(data, unit = 'ether') {
  return web3.utils.fromWei(data.toString(), unit);
}

export function toWeiData(data, unit = 'ether') {
  return web3.utils.toWei(data.toString(), unit);
}

export function formatNumByDecimals(value, decimals) {
  if (value === undefined || decimals === undefined) {
    return 0;
  }
  if (decimals === 0) {
    return new BigNumber(value).isInteger();
  }
  return new BigNumber(value).dividedBy(10 ** decimals).toString(10);
}

export function keep2Decimals(value) {
  return Math.round(value * 100) / 100;
}

export function toWei(data, unit) {
  return '0x' + web3.utils.toBN(web3.utils.toWei(data, unit)).toString(16);
}

export function checkCryptographic(pwd) {
  let reg = new RegExp('(?=^[^\\s]*$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[\\S]{6,}');

  return reg.test(pwd);
}

export function checkPhrase(phrase) {
  let formatPhrase = phrase.split(' ');
  return formatPhrase.length === 12 && formatPhrase.every(val => /^[a-z]{1,}$/.test(val));
}

export function randomSort(arr) {
  return arr.sort(() => Math.random() > 0.5 ? -1 : 1);
}

export function roundFun(value, n) {
  return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
}

export function floorFun(value, n = 2) {
  return Math.floor(value * Math.pow(10, n)) / Math.pow(10, n);
}

export function ceilFun(value, n = 2) {
  return Math.ceil(value * Math.pow(10, n)) / Math.pow(10, n);
}

export function timeFormat(time) {
  const current = new Date(time * 1000);
  let date = ('0' + current.getDate()).substr(-2);
  let hours = ('0' + current.getHours()).substr(-2);
  let minutes = ('0' + current.getMinutes()).substr(-2);
  let secondes = ('0' + current.getSeconds()).substr(-2);
  let month = ('0' + (current.getMonth() + 1)).substr(-2);
  return `${current.getFullYear()}-${month}-${date} ${hours}:${minutes}:${secondes}`;
}

export function daysAgo(time) {
  let data = (new Date().getTime() / 1000 - time) / (24 * 3600);
  return Math.round(data);
}

export function dateFormat(time) {
  const current = new Date(time * 1000);
  let date = ('0' + current.getDate()).substr(-2);
  let month = ('0' + (current.getMonth() + 1)).substr(-2);
  return `${current.getFullYear()}-${month}-${date}`;
}

export function isNumber(val) {
  let regPos = /^\d+(\.\d+)?$/; // 非负浮点数
  let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; // 负浮点数
  return !!(regPos.test(val) || regNeg.test(val));
}

export function formatNum(num) {
  if (num && num !== 'N/A') {
    if (num < 1) {
      return new BigNumber(num).toFixed();
    }
    let tempNum = new BigNumber(num).toString();
    let [left, right] = tempNum.split('.');
    let tempLeft = left.split('').reverse().join('').match(/(\d{1,3})/g);
    let tempRight = right ? `.${right}` : '';
    return tempLeft.join(',').split('').reverse().join('') + tempRight;
  } else {
    return num;
  }
}

export function normalNum(num, type = 'string') {
  let tempNum;
  if (num) {
    if (typeof num === 'number') {
      tempNum = new BigNumber(num).toString().split(',').join('');
    } else {
      tempNum = num.split(',').join('');
    }
    if (type === 'string') {
      return new BigNumber(tempNum).toString();
    } else {
      return new BigNumber(tempNum).toNumber();
    }
  } else {
    return num;
  }
}

export function isExceedBalance(balance, fee = 0, sendAmount = 0) {
  if (typeof fee === 'string') {
    fee = fee.split(' ')[0];
  }
  return new BigNumber(balance).minus(new BigNumber(fee)).lt(new BigNumber(sendAmount));
}

export function isSameString(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toUpperCase() === b.toUpperCase();
  } else {
    return false;
  }
}

export function promiseTimeout(ms, p, desc) {
  // Create a promise that rejects in <ms> milliseconds
  let id;
  let timeout = new Promise((resolve, reject) => {
    id = setTimeout(() => {
      clearTimeout(id);
      desc = desc || `Timed out in ${ms} ms!`;
      reject(desc);
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    p,
    timeout]);
};

export function upperFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function formatLongText(data, len = '8') {
  if (data.length > (len * 2)) {
    return data.substr(0, len) + '....' + data.substr(-len)
  } else {
    return data;
  }
}

export function showNA(data) {
  if (data === '0' || data === 0) {
    return 'N/A';
  } else {
    return data;
  }
}

export function wandWrapper(action, options = {}) {
  return new Promise((resolve, reject) => {
    wand.request(action, options, (err, ret) => {
      if (err || (ret && (ret.code === false))) {
        console.log(`${action} Error: ${err}`);
        reject(err || ret);
      } else {
        resolve(ret);
      }
    })
  })
}

export function hexCharCodeToStr(str) {
  str = str.trim().replace(/^0x/g, '');
  if (str.length % 2 !== 0) {
    return '';
  }
  let tempstr = '';
  try {
    tempstr = decodeURIComponent(str.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
  } catch (err) {
    for (var b = 0; b < str.length; b = b + 2) {
      tempstr = tempstr + String.fromCharCode(parseInt(str.substr(b, 2), 16));
    }
  }
  return tempstr;
}

export function removeRedundantDecimal(num, left = 1, zeroLimit = 4, isCeil = true) {
  let result = num;
  if (num > 1) {
    result = isCeil ? (Math.ceil(num * 100) / 100) : keep2Decimals(num);
  } else {
    let zeroLength = /0\.(0*)/g.test(new BigNumber(num).toFixed()) ? RegExp.$1.length : 0;
    result = isCeil ? ceilFun(num, zeroLength <= zeroLimit ? zeroLength + 2 : zeroLength + left) : roundFun(num, zeroLength <= zeroLimit ? zeroLength + 2 : zeroLength + left);
  }
  return new BigNumber(result).toFixed();
}
