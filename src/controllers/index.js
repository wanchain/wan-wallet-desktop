import { hdUtil } from 'wanchain-js-sdk'
import Logger from '../utils/Logger'

const logger = Logger.getLogger('controllers')

export const generatePhrase = (targetWindow, pwd) => {
    let phrase
    try {
      phrase = hdUtil.generateMnemonic(pwd)
      targetWindow.webContents.send('phrase-generated', phrase)
    } catch (err) {
      logger.error(err.stack)
    }
}

export const hasPhrase = (targetWindow) => {
    let ret
    try {
      ret = hdUtil.hasMnemonic()
      targetWindow.webContents.send('phrase-exist', ret)
    } catch (err) {
      logger.error(err.stack)
    }
}

export const revealPhrase = (targetWindow, pwd) => {
    let phrase
    try {
        phrase = hdUtil.revealMnemonic(pwd)
        targetWindow.webContents.send('phrase-revealed', phrase)
    } catch (err) {
        logger.error(err.stack)
    }
}

export const unlockHDWallet = (targetWindow, pwd) => {
    let phrase
    try {
        phrase = hdUtil.revealMnemonic(pwd)
        hdUtil.initializeHDWallet(phrase)

        targetWindow.webContents.send('wallet-unlocked', true)
    } catch (err) {
        logger.error(err.stack)

        targetWindow.webContents.send('wallet-unlocked', false)
    }
}

export const lockHDWallet = (targetWindow) => {
     try {
        hdUtil.deleteHDWallet()

        targetWindow.webContents.send('wallet-locked', true)
     } catch (err) {
        logger.error(err.stack)

        targetWindow.webContents.send('wallet-locked', false)
     }
}

export const validatePhrase = (targetWindow, phrase) => {
    let ret
    try {
        ret = hdUtil.validateMnemonic(phrase)
        targetWindow.webContents.send('phrase-valid', ret)
    } catch (err) {
        logger.error(err.stack)
    }
}

export const getAddress = async (targetWindow, walletID, chainType, start, end) => {
    let address
    try {                                               
        address = await hdUtil.getAddress(walletID, chainType, start, end)
        targetWindow.webContents.send('address-generated', address)
    } catch (err) {
        logger.error(err.stack)
    } 
}

export default { generatePhrase, revealPhrase, unlockHDWallet, lockHDWallet, validatePhrase, getAddress }

