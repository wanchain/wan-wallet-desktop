import Web3 from 'web3';
const web3 = new Web3();

export function fromWei(data) {
  return web3.utils.fromWei(data);
}

export function toWei(data) {
  return web3.utils.toWei(data);
}

export function checkCryptographic(pwd) {
  let reg = new RegExp("(?=^[^\\s]*$)(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[\\S]{6,}");

  return reg.test(pwd);
}

export function checkPhrase(phrase) {
  let formatPhrase = phrase.split(' ');
  return formatPhrase.length === 12 && formatPhrase.every(val => /^[a-z]{1,}$/.test(val));
}

export function randomSort(arr) {
  return arr.sort(() => Math.random()>.5 ? -1 : 1);
}

export function timeFormat(time) {
  const current = new Date(time * 1000);
  const m = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Spt", "Oct", "Nov", "Dec");
  return `${m[current.getMonth()]}-${current.getDate()}-${current.getFullYear()} ${current.getHours()}:${current.getMinutes()}:${current.getSeconds()}`;
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