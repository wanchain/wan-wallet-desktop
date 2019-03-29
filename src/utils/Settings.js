import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import Logger from './Logger'
import yargs from 'yargs'

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
                    }
                })
                .help('h')
                .alias('h', 'help')
                .argv

const logger = Logger.getLogger('test')

logger.warn(`NETWORK ${argv.network}`)

class Settings {
    constructor() {
        this.logger = Logger.getLogger('settings')
        this.logger.info('setting initialized')
    }

    get userDataPath() {
        return app.getPath('userData')
    }

    // only truth for wallet mode: light or full mode supported
    get mode() {
        if (argv.mode) {
            return argv.mode
        }

        return defaultConfig.mode
    }

    // only truth of netwrok the wallect connected to
    get network() {
        if (argv.network) {
            return argv.network
        } 

        return this.loadUserData('network') || defaultConfig.network
    }

    loadUserData(filename) {
        const fullPath = this.constructUserDataPath(filename)

        this.logger.info(`loading content from file  ${fullPath}`)

        if (!fs.existsSync(fullPath)) {
            this.logger.info(`{fullPath} does not exist, trying to write default network into ${defaultConfig.network}`)
            this.saveUserData(filename, defaultConfig.network)
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
