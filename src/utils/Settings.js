import path from 'path'
import fs from 'fs'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { app } from 'electron'
import Logger from './Logger'
import yargs from 'yargs'

// caches for config
let _mode = undefined
let _network = undefined
let _lang = undefined
let _isDev = undefined

const defaultConfig = {
    mode: 'light',
    network: 'main',
    lang: 'en'
}

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
     * Create an instance of Settings class, with a logger appended
     */
    constructor() {
        this._logger = Logger.getLogger('settings')
        this._logger.info('setting initialized')
        this._db = low(new FileSync(app.getPath('userData') + '/config.json'))
    }

    get appName() {
        return 'Wan Wallet Desktop'
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

    /**
     * Return mode of WandWallet, light or full 
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

    _get(key) {
        let val = this._db.get(key).value()

        if (!val) {
            this._set(key, defaultConfig[key])
        }

        return val
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

    loadUserData(filename) {
        const fullPath = this.constructUserDataPath(filename)

        this._logger.info(`loading content from file  ${fullPath}`)

        if (!fs.existsSync(fullPath)) {
            this._logger.info(`${fullPath} does not exist, trying create a file and write default config`)
            console.log(defaultConfig[filename])
            this.saveUserData(filename, defaultConfig[filename])
            return null
        }

        try {
            const content = fs.readFileSync(fullPath, { encoding: 'utf8' })
            this._logger.info(`reading ${content} from ${fullPath}`)
            return content
        } catch (err) {
            this._logger.error(`failed to read from ${fullPath}`)
        }

        return null
    }

    saveUserData(filename, content) {
        if (!content) {
            return
        }

        const fullPath = this.constructUserDataPath(filename)

        try {
            this._logger.info(`saving ${content} to file ${fullPath}`)
            fs.writeFileSync(fullPath, content, { encoding: 'utf8' })
        } catch (err) {
            this._logger.error(`failed to write ${content} to file ${fullPath} with an error ${err.stack}`)
        }
    }

    constructUserDataPath(filePath) {
        return path.join(this.userDataPath, filePath)
    }

}

export default new Settings()
