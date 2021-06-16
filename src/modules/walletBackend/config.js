import path from 'path'
import setting from '~/src/utils/Settings'
import WalletHelper from '~/src/utils/Helper'

const DB_VERSION = '1.0.2'
class ConfigFactoryService {
    _init() {
        this.config = {}
        this.config.network = setting.network
        this.dataPathPrex = path.join(setting.userDataPath, `DB${setting.mnemonic == '0' ? '' : setting.mnemonic}`)

        if (this.config.network.includes('main')) {
            this.config.wanchain_js_testnet = false

            this.config.iWAN = {
                "url": ['api.wanchain.org', 'api.wanglutech.net'],
                "port": [8443, 8443],
                "wallet": {
                    "apikey": process.env.API_KEY,
                    "secret": process.env.SECRET_KEY
                }
            }

        } else {
            this.config.wanchain_js_testnet = true
            this.config.iWAN = {
                "url": ['apitest.wanchain.org'],
                "port": [8443],
                "wallet": {
                    "apikey": process.env.API_KEY,
                    "secret": process.env.SECRET_KEY
                }
            }
            // this.config.iWAN = {
            //     "url": ['192.168.1.179'],
            //     "port": [8443],
            //     "wallet": {
            //         "apikey": "d21b98b09c1b4f1001986401e25a27a07a4673140b5125b81cdfedcea4db9e7b",
            //         "secret": "93c30e4a70f5ec3d4427f76602851791aa58fb823773c96cf1347f8b0276b036"
            //     }
            // }
        }

        this.config.logPathPrex = WalletHelper.getLogPath()
        this.config.databasePathPrex = path.join(this.dataPathPrex, `${this.config.network}DB`)
        this.config.walletPathPrex = path.join(this.dataPathPrex, 'walletDB')
        this.config.logtofile = true
        // this.config.logtofile = false
        this.config.logfile = 'wanWalletSDK'
        this.config.MAX_CONFIRM_BLKS = 100000000
        this.config.MIN_CONFIRM_BLKS = 0
        this.config.dbExtConf = {
            "userTblVersion": DB_VERSION
        }
        this.config.loglevel = 'debug'
    }

    getConfig() {
        this._init()
        return this.config
    }
}

export default new ConfigFactoryService()