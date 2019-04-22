import { walletCore } from 'wanchain-js-sdk';
import Logger from '~/src/utils/Logger'
import defaultConfig from './config'

class WalletBackend {
    constructor(config) {
        this.logger = Logger.getLogger('walletBackend')
        this.config = Object.assign(defaultConfig, config)
        try {
            this.sdk = new walletCore(this.config)
        } catch (e) {
            this.logger.error(e.message || e.stack)            
        }

        this.logger.info('create walletbackend')
    }

    async init() {
        let err
        this.logger.info('start initing wallet backend')
        try {
            await this.sdk.init()
        } catch (e) {
            this.logger.error(e.message || e.stack) 
        }
        
        require('~/src/controllers')
        this.logger.info('finish initing wallet backend')
    }
}

export default new WalletBackend()