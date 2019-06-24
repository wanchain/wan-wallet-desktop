import _ from 'lodash'
import EventEmitter from 'events'
import Logger from '~/src/utils/Logger'
import rp from 'request-promise'
import setting from '~/src/utils/Settings'

const BINARY_URL = 'https://raw.githubusercontent.com/wanchain/wanwallet/wanchain3.0_beta/clientBinaries.json'

const logger = Logger.getLogger('ClientBinaryManager')

class Manager extends EventEmitter {
    constructor() {
        super()
        
    }

    async init(restart) {
        logger.info('Initializing...')

        // check every hour
        // setInterval(() => this._checkForNewConfig(true), 1000 * 60 * 60)

        try {
            await this._checkForNewConfig(restart)
        } catch (err) {
            logger.error(err.stack)
        }
    }

    async _checkForNewConfig(restart) {
        const nodeType = 'Gwan'
        let binariesDownloaded = false
        let nodeInfo
        let ifRemind = false

        logger.info(`Checking for new client binaries config from: ${BINARY_URL}`)

        this._emit('loadConfig', 'Fetch remote client config')

        const options = {
            uri: BINARY_URL,
            timeout: 1000*60*5,
            json: true
        }

        let latestConfig

        try {
            latestConfig = await rp(options)
            logger.info(`got BINARY_URL clients Gwan version: ${latestConfig.clients[nodeType].version}`)
            const nodeVersion = latestConfig.clients[nodeType].version
        } catch (err) {
            console.log(err)

            logger.error(err.code)
            logger.error(err.connect)
        }

        this._emit('loadConfig', 'Fetching local config')
        let localConfig

        try {
            localConfig = JSON.parse(fs.readFileSync(path.join(setting.userDataPath, 'clientBinaries.json')).toString())
        } catch (err) {

        }

        let skippedVersion

        try {
            skippedVersion = fs.readFileSync(path.join(setting.userDataPath, 'skippedNodeVersion.json')).toString()
            console.log()
        } catch (err) {

        }

        const platform = process.platform.replace('darwin', 'mac').replace('win32', 'win').replace('freebsd', 'linux').replace('sunos', 'linux')
        const binaryVersion = latestConfig.clients[nodeType].platforms[platform][process.arch]
        const checksums = _.pick(binaryVersion['download'], ['md5']) // return an object
        const algorithm = _.keys(checksums)
        const hash = _.values(checksums) 

        nodeInfo = {
            type: nodeType,
            version: nodeVersion,
            checksum: hash,
            algorithm
        }

        if (latestConfig 
            && JSON.stringify(localConfig) !== JSON.stringify(latestConfig)
            && nodeVersion !== skippedVersion) {
                logger.debug('New client binaries config found, asking user if they wish to update...');
            }

    }

    async _downloadBinary() {

    }

    _writeLocalConfig(content) {
        
    }

    _emit(status, msg) {
        logger.debug(`Status: ${status} - ${msg}`)

        this.emit('status', status, msg)
    }
}

export default new Manager()