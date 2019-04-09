import { hdUtil, ccUtil } from 'wanchain-js-sdk'
import Logger from '~/src/utils/Logger'
const WAN_BIP44_PREFIX = "m/44'/5718350'/0'/0/"

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

export const getBalance = async (targetWindow, chainType, addr) => {
    let balance
    try {
        if (!chainType) {
            throw new Error('chainType cannot be null')
        }

        if (!addr) {
            throw new Error('addr cannot be null')
        }
        
        switch (chainType) {
            case 'WAN':
                balance = await ccUtil.getWanBalance(addr)
                break;
        }
        targetWindow.webContents.send('balance-got', balance)
    } catch (err) {
        logger.error(err.stack)
    }
}

export const coinNormal = async (targetWindow, walletID, addrOffset, chainType, from, to, amount, gasPrice, gasLimit) => {
    const input = {
        symbol: chainType || 'WAN',
        from: from,
        to: to,
        amount: amount, // in wan or eth
        gasPrice: gasPrice || 180,
        gasLimit: gasLimit || 1000000,
        BIP44Path: WAN_BIP44_PREFIX.concat(addrOffset),
        walletID: parseInt(walletID)
    }

    try {
        const srcChain = global.crossInvoker.getSrcChainNameByContractAddr(chainType, chainType)
        const ret = await global.crossInvoker.invokeNormalTrans(srcChain, input)
        if (ret.code) {
            targetWindow.webContents.send('coin-normal', true)
        }
    } catch (err) {
        logger.error(err.stack)
        targetWindow.webContents.send('coin-normal', false)
    }
    
}

export default { generatePhrase, revealPhrase, unlockHDWallet, lockHDWallet, validatePhrase, getAddress, getBalance, coinNormal }

