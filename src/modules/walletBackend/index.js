import { walletCore } from 'wanchain-js-sdk';
import Logger from '~/src/utils/Logger'
import configService from './config'
import EventEmitter from 'events'

class WalletBackend extends EventEmitter {
    constructor(config) {
        super()
        this.logger = Logger.getLogger('walletBackend')
        // this.config = Object.assign(configService.getConfig(), config)
        // try {
            // this.sdk = new walletCore(this.config)
        // } catch (e) {
            // this.logger.error(e.message || e.stack)            
        // }

        // this.logger.info('create walletbackend')
    }

    async init(config) {
        // let err
        this.config = Object.assign(configService.getConfig(), config)
        console.log('This Config: ', this.config)
        try {
            this.logger.info('start creating walletbackend')
            this.sdk = new walletCore(this.config)
            this.logger.info('start initing walletbackend')
            await this.sdk.init()
        } catch (e) {
            this.logger.error(e.message || e.stack) 
        }
        
        require('~/src/controllers')
        this.logger.info('finish initing walletbackend')
        this.emit('init_done')
    }
}

export default new WalletBackend()