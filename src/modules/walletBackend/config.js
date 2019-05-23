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
            "url" :  this.config.network.includes('main') ? '192.168.1.58' : "192.168.1.58",
            "port": 38443,
            "wallet": {
                "apikey": "d21b98b09c1b4f1001986401e25a27a07a4673140b5125b81cdfedcea4db9e7c",
                "secret": "93c30e4a70f5ec3d4427f76602851791aa58fb823773c96cf1347f8b0276b035"
            }
        }
    }

    getConfig() {
        this._init()
        return this.config
    }
}

export default new ConfigFactoryService()