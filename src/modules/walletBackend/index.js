import { walletCore } from 'wanchain-js-sdk';
import Logger from '~/src/utils/Logger'
import configService from './config'
import EventEmitter from 'events'
import Windows from '~/src/modules/windows'

class WalletBackend extends EventEmitter {
    constructor(config) {
        super()
        this.logger = Logger.getLogger('walletBackend')
    }

    hdWalletDisconnectHandler(msg) {
        Windows.broadcast('notification', 'hdwallet', msg)
    }
  
    async init(config) {
        this.config = Object.assign(configService.getConfig(), config)
        try {
            this.logger.info('start creating walletbackend')
            this.sdk = new walletCore(this.config)
            this.logger.info('start initing walletbackend')
            await this.sdk.init()
        } catch (e) {
            this.logger.error(e.message || e.stack) 
        }
        
        this.sdk.on('disconnect', this.hdWalletDisconnectHandler)
        this.sdk.on('probeloss', this.hdWalletDisconnectHandler)
        this.logger.info('added event listeners for hardware wallet')

        this.logger.info('register walletbackend controllers')
        require('~/src/controllers')
        this.logger.info('finish initiating walletbackend')
        
        this.emit('initiationDone')
    }
}

export default new WalletBackend()