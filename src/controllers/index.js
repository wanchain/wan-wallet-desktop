import { hdUtil, ccUtil } from 'wanchain-js-sdk';
import Logger from '~/src/utils/Logger';
import { BIP44PATH } from '~/config/common';

const logger = Logger.getLogger('controllers');

export const generateMnemonic = pwd => {
    try {
      let mnemonic = hdUtil.generateMnemonic(pwd);
      return {
        code: true,
        result: mnemonic
      }
    } catch (err) {
      logger.error(err.stack);
      return {
        code: false,
        result: 'Generate Failure'
      }
    }
}

export const hasMnemonic = () => {
    try {
      return hdUtil.hasMnemonic()
    } catch (err) {
      logger.error(err.stack)
    }
}

export const revealMnemonic = pwd => {
    try {
        return hdUtil.revealMnemonic(pwd)
    } catch (err) {
        logger.error(err.stack)
    }
}

export const unlockHDWallet = pwd => {
    let phrase
    try {
        phrase = hdUtil.revealMnemonic(pwd)
        hdUtil.initializeHDWallet(phrase)
        return true
    } catch (err) {
        logger.error(err.stack)
    }
}

export const lockHDWallet = () => {
     try {
      hdUtil.deleteHDWallet()

        return true
     } catch (err) {
        logger.error(err.stack)

        return false
     }
}

export const validateMnemonic = (phrase) => {
    try {
        return hdUtil.validateMnemonic(phrase) 
    } catch (err) {
        logger.error(err.stack)
    }
}

export const createAddress = (start, end) => {
  return hdUtil.getAddress(1, 'WAN', start, end).then(ret => {
    console.log(ret)
    let code = hdUtil.createUserAccount(1, `${BIP44PATH.WAN}${start}`, {
      name: `Account${start+1}`,
      addr: `0x${ret.addresses[0].address}`
    });
    return {
      code: code,
      result: ret
    }
  }).catch(err => {
    logger.error(err.stack);
    return {
      code: false,
      result: 'failure'
    }
  })
};

export const getBalance = async (chainType, addr) => {
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
        return { [addr]: balance };
    } catch (err) {
        logger.error(err.stack)
    }
}

export const getUserAccountFromDB = () => {
  try {
    let accounts = hdUtil.getUserAccountForChain(5718350);
    return {
      code: true,
      result: accounts
    };
  } catch (err) {
    logger.error(err.stack);
    return {
      code: false,
      result: 'failure'
    }
  }
};

export const coinNormal = async (walletID, addrOffset, chainType, from, to, amount, gasPrice, gasLimit) => {
    const input = {
        symbol: chainType || 'WAN',
        from: from,
        to: to,
        amount: amount, // in wan or eth
        gasPrice: gasPrice || 180,
        gasLimit: gasLimit || 1000000,
        BIP44Path: BIP44PATH.WAN.concat(addrOffset),
        walletID: parseInt(walletID)
    }

    try {
        const srcChain = global.crossInvoker.getSrcChainNameByContractAddr(chainType, chainType)
        const ret = await global.crossInvoker.invokeNormalTrans(srcChain, input)
        if (ret.code) {
            return true;
        }
    } catch (err) {
        logger.error(err.stack)
        return false;
    }
    
}

export default {
  generateMnemonic,
  hasMnemonic,
  revealMnemonic,
  unlockHDWallet,
  lockHDWallet,
  validateMnemonic,
  createAddress,
  getBalance,
  getUserAccountFromDB,
  coinNormal
};