import { hdUtil } from 'wanchain-js-sdk'

export const generatePhrase = (targetWindow, pwd) => {
    try {
      const phrase = hdUtil.generateMnemonic(pwd)
      targetWindow.webContents.send('phrase-generated', phrase)
    } catch (err) {
      logger.error(err.stack)
    }
}

export const revealPhrase = (targetWindow, pwd) => {
    try {
        mnemonic = hdUtil.revealMnemonic(pwd)
        targetWindow.webContents.send('phrase-revealed', phrase)
    } catch (err) {
        logger.error(err.stack)
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

export const getAddress = async (targetWindow, walletID, chainType, path) => {
    let address
    try {
        address = await hdUtil.getAddress(walletID, chainType, path)
        targetWindow.webContents.send('address-generated', address)
    } catch (err) {
        logger.error(err.stack)
    } 
}

export default { generatePhrase, revealPhrase, validatePhrase, getAddress }

