import { observable, action, makeObservable } from 'mobx';

class Contacts {
  @observable contacts = {
    normalAddr: {},
    privateAddr: {},
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
      console.log('contacts-=-=', ret)
      self.contacts = ret;
    })
  }

  @action addAddress(chain, addr, obj) {
    return new Promise((resolve, reject) => {
      wand.request('contact_addAddress', [chain, addr, obj], (err, ret) => {
        if (err) {
          console.log(`Add normal contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          Object.assign(self.contacts.normalAddr[chain].address, { [addr]: obj });
          return resolve();
        }
      })
    })
  }

  @action addPrivateAddress(addr, obj) {
    console.log('addr, obj', addr, obj)
    return new Promise((resolve, reject) => {
      wand.request('contact_addPrivateAddress', [addr, obj], (err, ret) => {
        if (err) {
          console.log(`Add private contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          Object.assign(self.contacts.privateAddr.Wanchain.address, { [addr]: obj });
          return resolve();
        }
      })
    })
  }

  @action delAddress(chain, addr) {
    return new Promise((resolve, reject) => {
      wand.request('contact_delAddress', [chain, addr], (err, ret) => {
        if (err) {
          console.log(`Delete normal contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.normalAddr[chain].address[addr];
          return resolve();
        }
      })
    })
  }

  @action delPrivateAddress(addr) {
    return new Promise((resolve, reject) => {
      wand.request('contact_delPrivateAddress', [addr], (err, ret) => {
        if (err) {
          console.log(`Delete private contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.privateAddr.Wanchain.address[addr];
          return resolve();
        }
      })
    })
  }

  @action hasSameName(chain, name) {
    return new Promise((resolve, reject) => {
      wand.request('contact_hasSameName', [chain, name], (err, ret) => {
        if (err) {
          console.log(`Check contacts has same name failed: ${JSON.stringify(err)}`);
          return reject(err);
        } else {
          return resolve(ret);
        }
      })
    })
  }

  @action updateNormalContacts(addr, obj) {
    wand.request('contact_setNormal', { [addr]: obj }, (err, ret) => {
      if (err) return;
      if (ret) {
        Object.assign(self.contacts, obj);
      }
    })
  }
}

const self = new Contacts();
export default self;
