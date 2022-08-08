import fs from 'fs';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { app } from 'electron';
import Logger from './Logger';
import Setting from './Settings';

// caches for config
let _contacts = undefined;
let _network = undefined;

const defaultConfig = {
  contacts: {
    main: {
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
    },
    testnet: {
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
}

/** Contacts class */
class Contacts {
  /**
   * Create an instance of Contacts with a logger appended
   */
  constructor() {
    console.log('network', this.network)
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
    let contacts = this.contacts[this.network];
    const defaultContacts = defaultConfig.contacts[this.network];
    if (!contacts.normalAddr) this.set('normalAddr', defaultContacts.normalAddr);
    if (!contacts.privateAddr) this.set('privateAddr', defaultContacts.privateAddr);
    Object.keys(defaultContacts.normalAddr).forEach(chain => {
      if (!contacts.normalAddr[chain]) {
        this.set(`normalAddr.${chain}`, defaultContacts.normalAddr[chain]);
      }
    })
    if (!contacts.privateAddr.Wanchain) {
      this.set(`privateAddr.Wanchain`, defaultContacts.privateAddr.Wanchain);
    }
  }

  async reset() {
    try {
      await this.setSync('contacts', defaultConfig.contacts);
      return true;
    } catch (e) {
      console.error(e)
      return false;
    }
  }

  addAddress(chain, addr, obj) {
    const key = `normalAddr.${chain}.${addr}`;
    this.set(key, obj);
  }

  addPrivateAddress(addr, obj) {
    const key = `privateAddr.Wanchain.${addr}`;
    this.set(key, obj);
  }

  async delAddress(chain, addr) {
    const key = `normalAddr.${chain}.${addr}`;
    await this.remove(key);
  }

  async delPrivateAddress(addr) {
    const key = `privateAddr.Wanchain.${addr}`;
    await this.remove(key);
  }

  get contacts() {
    if (_contacts) {
      return _contacts;
    }

    return _contacts = this.get();
  }

  get network() {
    if (_network) {
      return _network;
    }

    return _network = Setting.get('network');
  }

  get(key) {
    if (!key) {
      key = `contacts`;
    } else if (key === 'contacts') {
      key = `contacts.${this.network}`;
    } else {
      key = `contacts.${this.network}.${key}`;
    }
    return this._get(key);
  }

  _get(key) {
    let val = this._db.get(key).value();
    if (!val) {
      if (defaultConfig[key]) {
        val = defaultConfig[key];
        this._set(key, defaultConfig[key]);
      }
    }
    return val;
  }

  set(key, value) {
    key = `contacts.${this.network}.${key}`;
    this._set(key, value);
  }

  _set(key, value) {
    this._db.set(key, value).write();
  }

  async setSync(key, value) {
    return await this._setSync(key, value);
  }

  async _setSync(key, value) {
    return await this._db.set(key, value).write();
  }

  async remove(key) {
    key = `contacts.${this.network}.${key}`;
    await this._remove(key);
  }

  async _remove(key) {
    await this._db.unset(key).write();
  }
}

export default new Contacts()
