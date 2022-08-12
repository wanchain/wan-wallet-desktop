import { observable, action, makeObservable } from 'mobx';
import { getHashKey } from '../utils/helper';
const AES = require('crypto-js/aes');
const Utf8 = require('crypto-js/enc-utf8');

class Contacts {
  @observable contacts = {
    normalAddr: {},
    privateAddr: {},
    pwdhash: '',
    isReveal: false
  };

  constructor() {
    makeObservable(this);
  }

  @action initContacts() {
    wand.request('contact_get', ['contacts'], (err, ret) => {
      if (err) {
        console.log(`Init contacts failed: ${JSON.stringify(err)}`);
        return;
      };
      self.contacts.normalAddr = ret.normalAddr;
      self.contacts.privateAddr = ret.privateAddr;
    })
  }

  @action savePwdhash(pwd) {
    const pwdhash = getHashKey(pwd + 'contact');
    self.contacts.pwdhash = pwdhash;
  }

  @action revealContacts(pwd) {
    self.savePwdhash(pwd);
    if (self.contacts.isReveal) return
    const { normalAddr, privateAddr } = self.contacts;
    Object.keys(normalAddr).map(chainName => {
      const chainObj = normalAddr[chainName];
      for (let key in chainObj) {
        try {
          const addressItem = chainObj[key];
          const bytes = AES.decrypt(addressItem, self.contacts.pwdhash);
          const originalText = bytes.toString(Utf8);
          const addressObj = JSON.parse(originalText);
          const {
            chainSymbol,
            address
          } = addressObj;
          const addr = String(address).toLocaleLowerCase();
          if (key === addr) {
            self.contacts.normalAddr[chainSymbol][key] = addressObj;
          } else {
            self.delExclusiveAddress(chainSymbol, key);
            self.addAddress(chainSymbol, addr, addressObj);
          }
        } catch (e) {
          self.delExclusiveAddress(chainName, key);
        }
      }
    })
    for (let key in privateAddr.Wanchain) {
      try {
        const addressItem = privateAddr.Wanchain[key];
        const bytes = AES.decrypt(addressItem, self.contacts.pwdhash);
        const originalText = bytes.toString(Utf8);
        const addressObj = JSON.parse(originalText);
        const { address } = addressObj;
        const addr = String(address).toLocaleLowerCase();
        if (key === addr) {
          self.contacts.privateAddr.Wanchain[addr] = addressObj;
        } else {
          self.delExclusivePrivateAddress(key);
          self.addPrivateAddress(addr, addressObj);
        }
      } catch (e) {
        self.delExclusivePrivateAddress(key);
      }
    }
    self.contacts.isReveal = true;
  }

  @action addAddress(chain, addr, obj) {
    const objStr = JSON.stringify(obj);
    addr = String(addr).toLocaleLowerCase();
    const ciphertext = AES.encrypt(objStr, self.contacts.pwdhash).toString();
    return new Promise((resolve, reject) => {
      wand.request('contact_addAddress', [chain, addr, ciphertext], (err, ret) => {
        if (err) {
          console.log(`Add normal contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          Object.assign(self.contacts.normalAddr[chain], { [addr]: obj });
          return resolve();
        }
      })
    })
  }

  @action addPrivateAddress(addr, obj) {
    const objStr = JSON.stringify(obj);
    addr = String(addr).toLocaleLowerCase();
    const ciphertext = AES.encrypt(objStr, self.contacts.pwdhash).toString();
    return new Promise((resolve, reject) => {
      wand.request('contact_addPrivateAddress', [addr, ciphertext], (err, ret) => {
        if (err) {
          console.log(`Add private contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          Object.assign(self.contacts.privateAddr.Wanchain, { [addr]: obj });
          return resolve();
        }
      })
    })
  }

  @action delAddress(chain, addr) {
    console.log('chain', chain, addr)
    addr = String(addr).toLocaleLowerCase();
    console.log('chain2', chain, addr)
    return new Promise((resolve, reject) => {
      wand.request('contact_delAddress', [chain, addr], (err, ret) => {
        if (err) {
          console.log(`Delete normal contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.normalAddr[chain][addr];
          return resolve();
        }
      })
    })
  }

  @action delExclusiveAddress(chain, addr) {
    return new Promise((resolve, reject) => {
      wand.request('contact_delAddress', [chain, addr], (err, ret) => {
        if (err) {
          console.log(`Delete normal contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.normalAddr[chain][addr];
          return resolve();
        }
      })
    })
  }

  @action delPrivateAddress(addr) {
    addr = String(addr).toLocaleLowerCase();
    return new Promise((resolve, reject) => {
      wand.request('contact_delPrivateAddress', [addr], (err, ret) => {
        if (err) {
          console.log(`Delete private contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.privateAddr.Wanchain[addr];
          return resolve();
        }
      })
    })
  }

  @action delExclusivePrivateAddress(addr) {
    return new Promise((resolve, reject) => {
      wand.request('contact_delPrivateAddress', [addr], (err, ret) => {
        if (err) {
          console.log(`Delete private contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.privateAddr.Wanchain[addr];
          return resolve();
        }
      })
    })
  }

  @action reset() {
    return new Promise((resolve, reject) => {
      wand.request('contact_reset', [''], (err, ret) => {
        if (err) {
          console.log(`Reset contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        }
        if (ret) {
          // self.contacts = ret;
          return resolve(ret);
        }
      })
    })
  }

  @action hasSameName(chain, name) {
    let nameArr = [];
    if (chain === 'Wanchain') {
      Object.values(self.contacts.privateAddr.Wanchain).map(v => nameArr.push(v.name))
    }
    Object.values(self.contacts.normalAddr[chain]).map(v => nameArr.push(v.name))
    return nameArr.includes(name);
  }

  @action hasSameContact(addr, chain = 'Wanchain') {
    addr = String(addr).toLocaleLowerCase();
    const normalContact = self.contacts.normalAddr[chain][addr];
    const privateContact = chain === 'Wanchain' ? self.contacts.privateAddr.Wanchain[addr] : undefined;
    return Boolean(privateContact || normalContact);
  }
}

const self = new Contacts();
export default self;
