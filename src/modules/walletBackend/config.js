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
            "wallet": {
                "apikey": "fa5078fd834201d1d5bd57908a3069fe8ba560f329c060dffe04ccb52a9f1fcb",
                "secret": "67ab8ebd6ade75b5a9ae3761f03aa3750ce73a1d859dd070bddd72436c7d5957"
            }
        }
    }

    getConfig() {
        this._init()
        return this.config
    }
}

export default new ConfigFactoryService()