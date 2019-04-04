import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import Logger from './Logger'
import yargs from 'yargs'

// caches for config
let _mode = undefined
let _network = undefined

const defaultConfig = {
    mode: 'light',
    network: 'testnet'
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
        this.logger = Logger.getLogger('settings')
        this.logger.info('setting initialized')
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

        return _mode = this.loadUserData('mode') || defaultConfig.mode
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

        return _network = this.loadUserData('network') || defaultConfig.network
    }

    loadUserData(filename) {
        const fullPath = this.constructUserDataPath(filename)

        this.logger.info(`loading content from file  ${fullPath}`)

        if (!fs.existsSync(fullPath)) {
            this.logger.info(`${fullPath} does not exist, trying create a file and write default config`)
            console.log(defaultConfig[filename])
            this.saveUserData(filename, defaultConfig[filename])
            return null
        }

        try {
            const content = fs.readFileSync(fullPath, { encoding: 'utf8' })
            this.logger.info(`reading ${content} from ${fullPath}`)
            return content
        } catch (err) {
            this.logger.error(`failed to read from ${fullPath}`)
        }

        return null
    }

    saveUserData(filename, content) {
        if (!content) {
            return
        }

        const fullPath = this.constructUserDataPath(filename)

        try {
            this.logger.info(`saving ${content} to file ${fullPath}`)
            fs.writeFileSync(fullPath, content, { encoding: 'utf8' })
        } catch (err) {
            this.logger.error(`failed to write ${content} to file ${fullPath} with an error ${err.stack}`)
        }
    }

    constructUserDataPath(filePath) {
        return path.join(this.userDataPath, filePath)
    }

}

export default new Settings()
