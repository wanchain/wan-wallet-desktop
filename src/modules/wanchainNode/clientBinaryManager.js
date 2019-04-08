import EventEmitter from 'events'
import Logger from '../../utils/Logger'
import rp from 'request-promise'

const logger = Logger.getLogger('ClientBinaryManager')

class Manager extends EventEmitter {
    constructor() {
        super()

    }

    init(restart) {
        logger.info('Initializing...')

        // check every hour
        setInterval(() => this._checkForNewConfig(true), 1000 * 60 * 60)

        return this._checkForNewConfig(restart)
    }

    _checkForNewConfig(restart) {
        const nodeType = 'Gwan'
        let binariesDownloaded = false
        let nodeInfo
        let ifRemind = false

        logger.info(`Checking for new client binaries config from: ${BINARY_URL}`)

        this._emit('loadConfig', 'Fetch remote client config')
    }

    _emit(status, msg) {
        logger.debug(`Status: ${status} - ${msg}`)

        this.emit('status', status, msg)
    }
}

export default new Manager()