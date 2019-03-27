import { walletCore } from 'wanchain-js-sdk';
import Logger from '../utils/Logger'
import setting from '../utils/Settings'

const defaultConfig = {
    wanchain_js_testnet: setting.network === 'testnet',
    network: setting.network,
    useLocalNode: false,
    loglevel: 'debug',
    MIN_CONFIRM_BLKS : 0,
    MAX_CONFIRM_BLKS : 1000000,
}


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