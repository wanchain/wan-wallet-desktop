import { walletCore } from 'wanchain-js-sdk';
import Logger from '../utils/Logger'
import defaultConfig from './config'

class WalletBackend {
    constructor(config) {
        this.logger = Logger.getLogger('walletBackend')
        this.config = Object.assign(defaultConfig, config)
        this.core = new walletCore(this.config)
        this.logger.info('create walletbackend')
    }

    async init() {
        this.logger.info('start initing wallet backend')
        await this.core.init()
        require('../controllers')
        this.logger.info('finish initing wallet backend')
    }
}

export default new WalletBackend()