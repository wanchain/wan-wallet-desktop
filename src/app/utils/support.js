import Web3 from 'web3';
const web3 = new Web3();

export function fromWei(data) {
  return web3.utils.fromWei(data);
}

export function checkCryptographic(pwd) {
  let reg = new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}");
  return reg.test(pwd);
}

export function checkPhrase(phrase) {
  let formatPhrase = phrase.split(' ');
  return formatPhrase.length === 12 && formatPhrase.every(val => /^[a-z]{1,}$/.test(val));
}

export function randomsort(arr) {
  return arr.sort(() => Math.random()>.5 ? -1 : 1);
}

export function timeFormater(time) {
  const current = new Date(time * 1000);
  const m = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Spt", "Oct", "Nov", "Dec");
  return `${m[current.getMonth()]}-${current.getDate()}-${current.getFullYear()} ${current.getHours()}:${current.getMinutes()}:${current.getSeconds()}`;
}