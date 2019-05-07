export function fromWei(data) {
  return data / (10 ** 18);
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