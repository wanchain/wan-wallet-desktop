import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import Logger from './Logger'

const DEFAULT_NETWORK = 'testnet'

class Settings {
    constructor() {
        this.logger = Logger.getLogger('settings')
        this.logger.info('setting initialized')
    }

    get userDataPath() {
        return app.getPath('userData')
    }

    get network() {
        return this.loadUserData('network') || DEFAULT_NETWORK
    }

    loadUserData(filename) {
        const fullPath = this.constructUserDataPath(filename)

        this.logger.info(`load content from file  ${fullPath}`)

        if (!fs.existsSync(fullPath)) {
            this.logger.info(`{fullPath} does not exist, trying to write default ${DEFAULT_NETWORK}`)
            this.saveUserData(filename, DEFAULT_NETWORK)
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
