import _ from 'lodash'
import { ipcMain } from 'electron'
import { hdUtil, ccUtil } from 'wanchain-js-sdk'
import Logger from '~/src/utils/Logger'
import { CHANNELS, BIP44PATH } from '~/config/common'
import { Windows } from '~/src/modules'

const logger = Logger.getLogger('controllers')
const ipc = ipcMain

const ROUTE_PHRASE = 'phrase'
const ROUTE_WALLET = 'wallet'
const ROUTE_ADDRESS = 'address'

ipc.on(ROUTE_PHRASE, (event, action, payload) => {
    let err, phrase, ret
    switch (action) {
        case 'generate':
            try {
                phrase = hdUtil.generateMnemonic(payload.pwd)

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            
            sendResponse([ROUTE_PHRASE, action].join('_'), event, { err: err, data: phrase })

            break
        case 'has':
            try {
                ret = hdUtil.hasMnemonic()
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, action].join('_'), event, { err: err, data: !!ret })

            break
        case 'reveal': 
            try {
                phrase = hdUtil.revealMnemonic(payload.pwd)

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            
            sendResponse([ROUTE_PHRASE, action].join('_'), event, { err: err, data: phrase })

            break
        case 'delete': 

            break
    }
})

ipc.on(ROUTE_WALLET, (event, action, payload) => {
    let err

    switch (action) {
        case 'lock':
            try {
                hdUtil.deleteHDWallet()
                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: true })

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: false })
            }

            break
        case 'unlock':
            let phrase
            try {
                phrase = hdUtil.revealMnemonic(payload.pwd)
                hdUtil.initializeHDWallet(phrase)
                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: true })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: false })
            }

            break
    }
})

ipc.on(ROUTE_ADDRESS, async (event, action, payload) => {
    let err, address

    switch (action) {
        case 'get':
            try {
                address = await hdUtil.getAddress(payload.walletID, payload.chainType, payload.start, payload.end)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
           
            sendResponse([ROUTE_ADDRESS, action].join('_'), event, { err: err, data: address })
            break
        case 'balance':
            let balance
            try {
                logger.info(`address request balance is: 0x${payload.addr}` )
                balance = await ccUtil.getWanBalance('0x'+payload.addr)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            
            sendResponse([ROUTE_ADDRESS, action].join('_'), event, { err: err, data: balance })
            break
    }
})

function sendResponse(endpoint, e, payload) {
    const id = e.sender.id
    const senderWindow = Windows.getById(id)
    senderWindow.send('renderer_windowMessage', endpoint, payload)
}

// export const coinNormal = async (targetWindow, walletID, addrOffset, chainType, from, to, amount, gasPrice, gasLimit) => {
//     const input = {
//         symbol: chainType || 'WAN',
//         from: from,
//         to: to,
//         amount: amount, // in wan or eth
//         gasPrice: gasPrice || 180,
//         gasLimit: gasLimit || 1000000,
//         BIP44Path: BIP44PATH.WAN.concat(addrOffset),
//         walletID: parseInt(walletID)
//     }

//     try {
//         const srcChain = global.crossInvoker.getSrcChainNameByContractAddr(chainType, chainType)
//         const ret = await global.crossInvoker.invokeNormalTrans(srcChain, input)
//         if (ret.code) {
//             targetWindow.webContents.send(CHANNELS.TX_NORMAL, true)
//         }
//     } catch (err) {
//         logger.error(err.stack)
//         targetWindow.webContents.send(CHANNELS.TX_NORMAL, false)
//     }
    
// }

