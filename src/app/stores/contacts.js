import { observable, action, makeObservable } from 'mobx';

class Contacts {
  @observable contacts = {
    normal: {},
    private: {},
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
          console.log(`Init contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          Object.assign(self.contacts.normal[chain].address, { [addr]: obj });
          return resolve();
        }
      })
    })
  }

  @action delAddress(chain, addr) {
    return new Promise((resolve, reject) => {
      wand.request('contact_delAddress', [chain, addr], (err, ret) => {
        if (err) {
          console.log(`Init contacts failed: ${JSON.stringify(err)}`);
          return reject(err);
        };
        if (ret) {
          delete self.contacts.normal[chain].address[addr];
          return resolve();
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
