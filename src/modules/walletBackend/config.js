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