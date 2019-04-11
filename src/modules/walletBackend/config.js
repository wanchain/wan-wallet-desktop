import path from 'path'
import setting from '~/src/utils/Settings'
import WalletHelper from '~/src/utils/Helper'

const dataPathPrex = path.join(setting.userDataPath, 'Db')

const config = {}
config.network = setting.network

if (setting.network.includes('main')) {
    config.wanchain_js_testnet = false
    config.socketUrl = 'wss://api.wanchain.info'
    
} else {
    config.wanchain_js_testnet = true
    config.socketUrl = 'wss://apitest.wanchain.info'
}

config.logPathPrex = WalletHelper.getLogPath()
config.databasePathPrex = path.join(dataPathPrex, `${config.network}DB`)
config.walletPathPrex = path.join(dataPathPrex, 'walletDB')

config.MAX_CONFIRM_BLKS = 100000000
config.MIN_CONFIRM_BLKS = 0

config.iWAN = {
    "url" : "apitest.wanchain.org",
    "wallet": {
        "apikey": "fa5078fd834201d1d5bd57908a3069fe8ba560f329c060dffe04ccb52a9f1fcb",
        "secret": "67ab8ebd6ade75b5a9ae3761f03aa3750ce73a1d859dd070bddd72436c7d5957"
    }
}

export default config