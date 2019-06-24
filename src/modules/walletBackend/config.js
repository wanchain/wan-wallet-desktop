import path from 'path'
import setting from '~/src/utils/Settings'
import WalletHelper from '~/src/utils/Helper'

const dataPathPrex = path.join(setting.userDataPath, 'Db')

class ConfigFactoryService {
    _init() {
        this.config = {}
        this.config.network = setting.network

        if (this.config.network.includes('main')) {
            this.config.wanchain_js_testnet = false
            this.config.socketUrl = 'wss://api.wanchain.info'
            
        } else {
            this.config.wanchain_js_testnet = true
            this.config.socketUrl = 'wss://apitest.wanchain.info'
        }

        this.config.logPathPrex = WalletHelper.getLogPath()
        this.config.databasePathPrex = path.join(dataPathPrex, `${this.config.network}DB`)
        this.config.walletPathPrex = path.join(dataPathPrex, 'walletDB')

        this.config.MAX_CONFIRM_BLKS = 100000000
        this.config.MIN_CONFIRM_BLKS = 0

        this.config.iWAN = {
            "url" :  this.config.network.includes('main') ? 'api.wanchain.org' : "apitest.wanchain.org",
            // "url" :  this.config.network.includes('main') ? '192.168.1.58' : "192.168.1.58",
            // "url" :  this.config.network.includes('main') ? '54.183.204.219' : "54.183.204.219",
            "port": 8443,
            "wallet": {
                "apikey": process.env.API_KEY,
                "secret": process.env.SECRET_KEY
            }
        }
    }

    getConfig() {
        this._init()
        return this.config
    }
}

export default new ConfigFactoryService()