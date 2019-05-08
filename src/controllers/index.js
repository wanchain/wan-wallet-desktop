import fs from 'fs'
import _ from 'lodash'
import { ipcMain } from 'electron'
import { hdUtil, ccUtil } from 'wanchain-js-sdk'
import Logger from '~/src/utils/Logger'
import setting from '~/src/utils/Settings'
import { Windows } from '~/src/modules'

const logger = Logger.getLogger('controllers')
const ipc = ipcMain

const ROUTE_PHRASE = 'phrase'
const ROUTE_WALLET = 'wallet'
const ROUTE_ADDRESS = 'address'
const ROUTE_ACCOUNT = 'account'
const ROUTE_TX = 'transaction'
const ROUTE_QUERY = 'query'

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
        case 'import':
            try {
                ret = hdUtil.importMnemonic(payload.phrase, payload.pwd)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, action].join('_'), event, { err: err, data: !!ret })
            break

        case 'importKeyFile':
            const WANBIP44Path = "m/44'/5718350'/0'/0/0"
            const { keyFilePwd, hdWalletPwd, keyFilePath } = payload
            const keyFileContent = fs.readFileSync(keyFilePath).toString()
            console.log(keyFileContent)
            try {
                ret = hdUtil.importKeyStore(WANBIP44Path, keyFileContent, keyFilePwd, hdWalletPwd)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, action].join('_'), event, { err: err, data: !!ret })
            break
    }
})

ipc.on(ROUTE_WALLET, async (event, action, payload) => {
    let err

    switch (action) {
        case 'lock':
            try {
                hdUtil.deleteHDWallet()
                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: true })

            } catch (e) {
                console.log(e)
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

        case 'getPubKeyChainId':
            {
                let { walletID, path } = payload
                let pubKey

                try {
                    pubKey = await hdUtil.getWalletSafe().getWallet(walletID).getPublicKey(path, true)
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: pubKey })
                break
            }

        case 'getPubKey':
            {
                let pubKey

                try {
                    pubKey = await hdUtil.getWalletSafe().getWallet(payload.walletID).getPublicKey(payload.path)
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: pubKey })
                break
            }

        case 'isConnected':
            {
                let ret = false;
                try {
                    hdUtil.getWalletSafe().getWallet(payload.walletID);
                    ret = true;
                } catch (e) {
                    ret = false
                }

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: ret })
                break
            }

        case 'signTransaction':
            {
                let sig = {};
                let { walletID, path, rawTx } = payload;
                let hdWallet = hdUtil.getWalletSafe().getWallet(walletID);

                try {
                    let ret = await hdWallet.sec256k1sign(path, rawTx);
                    sig.r = '0x' + ret.r.toString('hex');
                    sig.s = '0x' + ret.s.toString('hex');
                    sig.v = '0x' + ret.v.toString('hex');
                    console.log("ret", ret);
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }

                sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: sig })
                break
            }

        case 'connectToLedger':
            let data = false;
            try {
                await hdUtil.connectToLedger()
                data = true;
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_WALLET, action].join('_'), event, { err: err, data: data })
            break
    }
})

ipc.on(ROUTE_ADDRESS, async (event, action, payload) => {
    let err, address, nonce

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

        case 'getNonce':
            try {
                // nonce = await ccUtil.getNonceByLocal(payload.addr, payload.chainType)
                nonce = await ccUtil.getNonce(payload.addr, payload.chainType, payload.includePending)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, action].join('_'), event, { err: err, data: nonce })
            break
        case 'balance':
            let balance
            const { addr } = payload

            try {
                if (_.isArray(addr) && addr.length > 1) {
                    const addresses = addr.map(item => `0x${item}`)
                    balance = await ccUtil.getMultiWanBalances(addresses)

                } else {
                    balance = await ccUtil.getWanBalance(`0x${addr}`)
                    balance = { [`0x${addr}`]: balance }
                }
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, action].join('_'), event, { err: err, data: balance })
            break
    }
})

ipc.on(ROUTE_ACCOUNT, (event, action, payload) => {
    let err, ret
    switch (action) {
        case 'create':
            try {
                ret = hdUtil.createUserAccount(payload.walletID, payload.path, payload.meta)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, action].join('_'), event, { err: err, data: ret })
            break

        case 'get':
            try {
                ret = hdUtil.getUserAccount(payload.walletID, payload.path)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, action].join('_'), event, { err: err, data: ret })
            break

        case 'getAll':
            try {
                ret = hdUtil.getUserAccountForChain(payload.chainID)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, action].join('_'), event, { err: err, data: ret })
            break
        case 'update':
            try {
                ret = hdUtil.updateUserAccount(payload.walletID, payload.path, payload.meta)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, action].join('_'), event, { err: err, data: ret })
            break

        case 'delete':
            try {
                ret = hdUtil.deleteUserAccount(payload.walletID, payload.path)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, action].join('_'), event, { err: err, data: ret })
            break
    }
})

ipc.on(ROUTE_TX, async (event, action, payload) => {
    let ret, err
    switch (action) {
        case 'normal':
            try {
                let { walletID, chainType, symbol, path, to, amount, gasPrice, gasLimit } = payload
                let from = await hdUtil.getAddress(walletID, chainType, path)

                let input = {
                    "symbol": symbol,
                    "from": '0x' + from.address,
                    "to": to,
                    "amount": amount,
                    "gasPrice": gasPrice,
                    "gasLimit": gasLimit,
                    "BIP44Path": path,
                    "walletID": walletID
                }

                let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(symbol, chainType);
                ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, action].join('_'), event, { err: err, data: ret })
            break

        case 'raw':
            console.log("raw", payload)
            try {
                ret = await ccUtil.sendTrans(payload.raw, payload.chainType)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, action].join('_'), event, { err: err, data: ret })
            break

        case 'getGasLimit':
            try {
                ret = await ccUtil.getGasLimit(payload.chainType);
            } catch (err) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_QUERY, action].join('_'), event, { err: err, data: ret })
            break;
    }
})

ipc.on(ROUTE_QUERY, async (event, action, payload) => {
    let ret, err
    switch (action) {
        case 'config':
            let { param } = payload
            try {
                let conf = setting[`${param}`]
                ret = { [param]: conf }
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_QUERY, action].join('_'), event, { err: err, data: ret })
            break

        case 'getGasPrice':
            try {
                ret = await ccUtil.getGasPrice(payload.chainType);
            } catch (err) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_QUERY, action].join('_'), event, { err: err, data: ret })
            break;
    }

})

function sendResponse(endpoint, e, payload) {
    const id = e.sender.id
    const senderWindow = Windows.getById(id)
    const { err } = payload
    if (!_.isEmpty(err)) payload.err = errorWrapper(err)
    senderWindow.send('renderer_windowMessage', endpoint, payload)
}

function errorWrapper(err) {
    return { desc: err.message, code: err.errno, cat: err.name }
}
