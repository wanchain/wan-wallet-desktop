import fs from 'fs'
import path from 'path'
import { app } from 'electron'

/** Wallet Helper class */
class WalletHelper {
    /**
     * Make a new directory 
     * @param {string} dirname - log file path
     * @return {string} log file path
     */
    mkdirSync(dirname) {
        if (fs.existsSync(dirname)) {
            return true
        }

        if (this.mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname)
            return true
        }

        return false
    }
    /**
     * Return log file path for electron main process
     * @return {string} electron main process log path
     */
    getLogPath() {
        let logPath 
        if (process.platform === 'freebsd' || process.platform === 'linux' || process.platform === 'openbsd') {
            const userDataPath = app.getPath('userData')
            logPath = userDataPath + '/Logs'
            if (!this.mkdirSync(logPath)) {
                throw new Error(`user data dir: ${logPath} does not exist`)
            }
        } else {
            logPath = app.getPath('logs')
        }

        return logPath
    }
}

export default new WalletHelper()