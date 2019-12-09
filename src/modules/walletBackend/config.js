import path from 'path'
import setting from '~/src/utils/Settings'
import WalletHelper from '~/src/utils/Helper'

const dataPathPrex = path.join(setting.userDataPath, 'Db')
const DB_VERSION = '1.0.1'
class ConfigFactoryService {
    _init() {
        this.config = {}
        this.config.network = setting.network

        if (this.config.network.includes('main')) {
            this.config.wanchain_js_testnet = false
            this.config.socketUrl = 'wss://api.wanchain.info'

            this.config.iWAN = {
              "url": 'api.wanchain.org',
              "port": 8443,
              "wallet": {
                  "apikey": process.env.API_KEY,
                  "secret": process.env.SECRET_KEY
              }
          }

        } else {
            this.config.wanchain_js_testnet = true
            // this.config.socketUrl = 'wss://apitest.wanchain.info'
            this.config.socketUrl = 'wss://192.168.1.179:10443'
            this.config.iWAN = {
              "url": "192.168.1.179",
              "port": 10443,
              "wallet": {
                  "apikey": "d21b98b09c1b4f1001986401e25a27a07a4673140b5125b81cdfedcea4db9e7b",
                  "secret": "93c30e4a70f5ec3d4427f76602851791aa58fb823773c96cf1347f8b0276b036"
              }
          }
        }

        this.config.logPathPrex = WalletHelper.getLogPath()
        this.config.databasePathPrex = path.join(dataPathPrex, `${this.config.network}DB`)
        this.config.walletPathPrex = path.join(dataPathPrex, 'walletDB')
        this.config.logtofile = true
        this.config.logfile = 'wanWalletSDK'
        this.config.MAX_CONFIRM_BLKS = 100000000
        this.config.MIN_CONFIRM_BLKS = 0
        this.config.dbExtConf = {
            "userTblVersion": DB_VERSION
        }
        // this.config.loglevel = 'debug'
    }

    getConfig() {
        this._init()
        return this.config
    }
}

export default new ConfigFactoryService()