import fs from 'fs'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { app } from 'electron'
import Logger from './Logger'

// caches for config
let _contacts = undefined

const defaultConfig = {
  contacts: {
    normal: {
      Wanchain: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Wanchain'
      },
      Ethereum: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Ethereum'
      },
      Bitcoin: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Bitcoin'
      },
      XRPL: {
        address: {},
        imgUrl: '',
        chainSymbol: 'XRPL'
      },
      EOS: {
        address: {},
        imgUrl: '',
        chainSymbol: 'EOS'
      },
      BSC: {
        address: {},
        imgUrl: '',
        chainSymbol: 'BSC'
      }
    },
    private: {
      Wanchain: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Wanchain'
      },
      Ethereum: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Ethereum'
      },
      Bitcoin: {
        address: {},
        imgUrl: '',
        chainSymbol: 'Bitcoin'
      },
      XRPL: {
        address: {},
        imgUrl: '',
        chainSymbol: 'XRPL'
      },
      EOS: {
        address: {},
        imgUrl: '',
        chainSymbol: 'EOS'
      },
      BSC: {
        address: {},
        imgUrl: '',
        chainSymbol: 'BSC'
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
    this._logger = Logger.getLogger('contacts')
    this._logger.info('contacts initialized')
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
    Object.keys(defaultConfig.contacts.normal).forEach(chain => {
      if (contacts.normal[chain] === undefined) {
        this.set(`contacts.normal.${chain}`, defaultConfig.contacts.normal[chain])
      }
    })
    Object.keys(defaultConfig.contacts.private).forEach(chain => {
      if (contacts.private[chain] === undefined) {
        this.set(`contacts.private.${chain}`, defaultConfig.contacts.private[chain])
      }
    })
    // this.set(`contacts`, defaultConfig.contacts)
  }

  addAddress(chain, addr, obj) {
    const key = `contacts.normal.${chain}.address`;
    const addrObj = this.get(key);
    const newAddrObj = Object.assign({}, addrObj, {[addr]: obj});
    this.set(`contacts.normal.${chain}.address`, newAddrObj);
  }

  delAddress(chain, addr) {
    const key = `contacts.normal.${chain}.address`;
    let addrObj = Object.assign({}, this.get(key));
    delete addrObj[addr];
    console.log('addrObj-=-=', addrObj)
    this.set(`contacts.normal.${chain}.address`, addrObj);
  }

  addPrivateAddress(addr, obj) {
    this.set(`contacts.private.${chain}.address["${addr}"]`, obj);
  }

  get contacts() {
    console.log('dfdfd====get contacts')
    if (_contacts) {
      return _contacts
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
    this._set(key, value)
  }

  _set(key, value) {
    this._db.set(key, value).write();
  }

  remove(key) {
    this._remove(key)
  }

  _remove(key) {
    this._db.unset(key).write()
  }
}

export default new Contacts()
