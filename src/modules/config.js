import path from 'path'
import setting from '../utils/Settings'
import WalletHelper from '../utils/Helper'

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

export default config