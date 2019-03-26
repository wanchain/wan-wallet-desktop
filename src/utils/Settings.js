import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import Logger from './Logger'

const DEFAULT_NETWORK = 'main'

class Settings {
    init() {
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

        this.logger.info(`load user data ${fullPath}`)

        if (!fs.existsSync(fullPath)) {
            return null
        }

        // try {
        //     fs.accessSync(fullPath, fs.R_OK)
        // } catch (err) {
        //     this.logger.error(`network config file does not exist ${err.stack}`)
        // }

    }

    constructUserDataPath(filePath) {
        return path.join(this.userDataPath, filePath)
    }

}

export default new Settings()
