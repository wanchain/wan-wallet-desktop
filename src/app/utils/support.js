import Web3 from 'web3';
import { BigNumber } from 'bignumber.js';
import { totalmem } from 'os';

const web3 = new Web3();

export function fromWei (data) {
  return web3.utils.fromWei(data.toString());
}

export function keep2Decimals (value) {
  return Math.round(value * 100) / 100;
}

export function toWei (data, unit) {
  return '0x' + web3.utils.toBN(web3.utils.toWei(data, unit)).toString(16);
}

export function checkCryptographic (pwd) {
  let reg = new RegExp('(?=^[^\\s]*$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[\\S]{6,}');

  return reg.test(pwd);
}

export function checkPhrase (phrase) {
  let formatPhrase = phrase.split(' ');
  return formatPhrase.length === 12 && formatPhrase.every(val => /^[a-z]{1,}$/.test(val));
}

export function randomSort (arr) {
  return arr.sort(() => Math.random() > 0.5 ? -1 : 1);
}

export function roundFun (value, n) {
  return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
}

export function timeFormat (time) {
  const current = new Date(time * 1000);
  let date = ('0' + current.getDate()).substr(-2);
  let hours = ('0' + current.getHours()).substr(-2);
  let minutes = ('0' + current.getMinutes()).substr(-2);
  let secondes = ('0' + current.getSeconds()).substr(-2);
  let month = ('0' + (current.getMonth() + 1)).substr(-2);
  return `${current.getFullYear()}-${month}-${date} ${hours}:${minutes}:${secondes}`;
}

export function daysAgo (time) {
  let data = (new Date().getTime() / 1000 - time) / (24 * 3600);
  return Math.round(data);
}

export function dateFormat (time) {
  const current = new Date(time * 1000);
  let date = ('0' + current.getDate()).substr(-2);
  let month = ('0' + (current.getMonth() + 1)).substr(-2);
  return `${current.getFullYear()}-${month}-${date}`;
}

export function isNumber (val) {
  let regPos = /^\d+(\.\d+)?$/; // 非负浮点数
  let regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; // 负浮点数
  return !!(regPos.test(val) || regNeg.test(val));
}

export function formatNum (num) {
  if (num && num !== 'N/A') {
    let tempNum = new BigNumber(num).toString();
    let [left, right] = tempNum.split('.');
    let tempLeft = left.split('').reverse().join('').match(/(\d{1,3})/g);
    let tempRight = right ? `.${right}` : '';
    return tempLeft.join(',').split('').reverse().join('') + tempRight;
  } else {
    return num;
  }
}

export function normalNum (num, type = 'string') {
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

export function promiseTimeout (ms, p, desc) {
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
