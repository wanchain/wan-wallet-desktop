import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { app } from 'electron';
import Logger from './Logger';

// caches for config
let _contacts = undefined;

const defaultConfig = {
  contacts: {
    normalAddr: {
      Wanchain: {},
      Ethereum: {},
      Bitcoin: {},
      XRPL: {},
      EOS: {},
      BSC: {}
    },
    privateAddr: {
      Wanchain: {}
    }
  }
}

/** Contacts class */
class Contacts {
  /**
   * Create an instance of Contacts with a logger appended
   */
  constructor() {
    this._logger = Logger.getLogger('contacts');
    this._logger.info('contacts initialized');
    this.userPath = app.getPath('userData') + '/Contacts';
    if (!fs.existsSync(this.userPath)) {
      fs.mkdirSync(this.userPath);
    }
    this._logger.info('User data path: ' + this.userPath);

    try {
      this._db = low(new FileSync(this.userPath + '/config.json'));
    } catch (err) {
      let path = this.userPath + '/config.json';
      fs.copyFileSync(path, this.userPath + '/config-copy.json');
      fs.writeFileSync(path, '{}');
      this._db = low(new FileSync(path));
    } finally {
      this._logger.info('low db done');
      this.updateContactsByConfig();
    }
  }

  updateContactsByConfig() {
    let contacts = this.get('contacts');
    if (!contacts) this.set(`contacts`, defaultConfig.contacts);
    if (!contacts.normalAddr) this.set(`contacts.normalAddr`, defaultConfig.contacts.normalAddr);
    if (!contacts.privateAddr) this.set(`contacts.privateAddr`, defaultConfig.contacts.privateAddr);
    Object.keys(defaultConfig.contacts.normalAddr).forEach(chain => {
      if (!contacts.normalAddr[chain]) {
        this.set(`contacts.normalAddr.${chain}`, defaultConfig.contacts.normalAddr[chain]);
      }
    })
    if (!contacts.privateAddr.Wanchain) {
      this.set(`contacts.privateAddr.Wanchain`, defaultConfig.contacts.privateAddr.Wanchain);
    }
    // this.set(`contacts`, defaultConfig.contacts)
  }

  addAddress(chain, addr, obj) {
    const key = `contacts.normalAddr.${chain}`;
    const addrObj = this.get(key);
    const newAddrObj = Object.assign({}, addrObj, {[addr]: obj});
    this.set(key, newAddrObj);
  }

  addPrivateAddress(addr, obj) {
    const key = 'contacts.privateAddr.Wanchain';
    const addrObj = this.get(key);
    const newAddrObj = Object.assign({}, addrObj, {[addr]: obj});
    this.set(key, newAddrObj);
  }

  delAddress(chain, addr) {
    const key = `contacts.normalAddr.${chain}`;
    let addrObj = Object.assign({}, this.get(key));
    delete addrObj[addr];
    this.set(key, addrObj);
  }

  delPrivateAddress(addr) {
    const key = 'contacts.privateAddr.Wanchain';
    let addrObj = Object.assign({}, this.get(key));
    delete addrObj[addr];
    this.set(key, addrObj);
  }

  get contacts() {
    if (_contacts) {
      return _contacts;
    }

    return _contacts = this._get('contacts') || defaultConfig.contacts;
  }

  get(key) {
    return this._get(key);
  }

  _get(key) {
    let val = this._db.get(key).value();
    if (!val) {
      if (key in defaultConfig) {
        val = defaultConfig[key];
        this._set(key, defaultConfig[key]);
      }
    }
    return val;
  }

  set(key, value) {
    this._set(key, value);
  }

  _set(key, value) {
    this._db.set(key, value).write();
  }

  remove(key) {
    this._remove(key);
  }

  _remove(key) {
    this._db.unset(key).write();
  }
}

export default new Contacts()
