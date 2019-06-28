import path from 'path'
import fs from 'fs'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { app } from 'electron'
import Logger from './Logger'
import yargs from 'yargs'
import WalletHelper from '~/src/utils/Helper'

// caches for config
let _mode = undefined
let _network = undefined
let _lang = undefined
let _isDev = undefined
let _setting = undefined

const defaultConfig = {
    mode: 'light',
    /** TODO */
    // network: 'main',
    network: 'testnet',
    lang: 'en',
    settings: {
      reinput_pwd: false,
      staking_advance: false,
    }
}

const cscContractAddr = "0x00000000000000000000000000000000000000da";

const argv = yargs
                .options({
                    'network': {
                        demand: false,
                        default: null,
                        describe: 'Network to connect to: main or testnet',
                        nargs: 1,
                        type: 'string'
                    },
                    'mode': {
                        demand: false,
                        default: null,
                        describe: 'Mode the wallet will be running on',
                        nargs: 1,
                        type: 'string'
                    }
                })
                .help('h')
                .alias('h', 'help')
                .argv

/** Setting class */
class Settings {
    /**
     * Create an instance of Settings with a logger appended
     */
    constructor() {
        this._logger = Logger.getLogger('settings')
        this._logger.info('setting initialized')
        let path = app.getPath('userData');
        this._logger.info('User data path: ' + path);
        this._db = low(new FileSync(path + '/config.json'))
    }

    get appName() {
        return 'WAN Wallet'
    }

    get cscContractAddr() {
        return cscContractAddr;
    }

    get isDev() {
        if (_isDev) {
            return _isDev
        }

        return _isDev = process.env.NODE_ENV === 'development'
    }

    /**
     * Return application directory
     * @return {string} applicatin data path, platform dependent
     */
    get userDataPath() {
        return app.getPath('userData')
    }

    get appLogPath() {
        return WalletHelper.getLogPath()
    }

    /**
     * Return mode of WanWallet, light or full 
     * @return {string} wallet mode, light or full
     */
    get mode() {
        if (_mode) {
            return _mode
        }

        if (argv.mode) {
            return _mode = argv.mode
        }

        return _mode = this._get('mode') || defaultConfig.mode
    }

    /**
     * Return the network wallet is connected to, either main or testnet
     * @return {string} wanchain network, either mainnet or testnet
     */
    get network() {
        if (_network) {
            return _network
        }

        if (argv.network) {
            return _network = argv.network
        } 

        return _network = this._get('network') || defaultConfig.network
    }

    get language() {
        if (_lang) {
            return _lang
        }

        if (argv.lang) {
            return _lang = argv._lang
        }
        
        return _lang = this._get('lang') || defaultConfig.lang
    }

    get settings() {
      if (_settings) {
          return _settings
      }
      
      return _settings = this._get('settings') || defaultConfig.settings
    }

    get autoLockTimeout() {
        // auto lock the wallet if main window loses focus for a period of time. 5 min
        return 5 * 60 * 1000
    }

    get idleCheckInterval() {
        return 1 * 60 * 1000
    }

    get(key) {
        return this._get(key)
    }

    _get(key) {
        let val = this._db.get(key).value()

        if (!val) {
            this._set(key, defaultConfig[key])
        }

        return val
    }

    set(key, value) {
        this._set(key, value)
    }

    _set(key, value) {
        this._db.set(key, value).write()
    }

    switchNetwork() {
        const beforeSwitchNetwork = _network
        _network = undefined

        const [ afterSwitchNetwork ] = ['main', 'testnet'].filter(item => item !== beforeSwitchNetwork)

        this._set('network', afterSwitchNetwork)

        _network = afterSwitchNetwork
    }
    
    switchLang(langCode) {
        const beforeSwitchLang = _lang
        _lang = undefined

        this._set('lang', langCode)

        _lang = langCode
    }
}

export default new Settings()
