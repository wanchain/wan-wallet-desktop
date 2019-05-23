import fs from 'fs'
import _ from 'lodash'
import { ipcMain } from 'electron'
import { hdUtil, ccUtil } from 'wanchain-js-sdk'
import Logger from '~/src/utils/Logger'
import setting from '~/src/utils/Settings'
import { Windows } from '~/src/modules'
import Web3 from 'web3';
const web3 = new Web3();

const logger = Logger.getLogger('controllers')
const ipc = ipcMain

// route consts
const ROUTE_PHRASE = 'phrase'
const ROUTE_WALLET = 'wallet'
const ROUTE_ADDRESS = 'address'
const ROUTE_ACCOUNT = 'account'
const ROUTE_TX = 'transaction'
const ROUTE_QUERY = 'query'
const ROUTE_STAKING = 'staking'

// db collection consts
const DB_NORMAL_COLLECTION = 'normalTrans'

// wallet path consts
const WANBIP44Path = "m/44'/5718350'/0'/0/0"

// chain ID consts
const WAN_ID = 5718350

ipc.on(ROUTE_PHRASE, (event, actionUni, payload) => {
    let err, phrase, ret
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'generate':
            try {
                phrase = hdUtil.generateMnemonic(payload.pwd)

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: phrase })

            break
        case 'has':
            try {
                ret = hdUtil.hasMnemonic()
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: ret })

            break
        case 'reveal':
            try {
                phrase = hdUtil.revealMnemonic(payload.pwd)

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: phrase })

            break
        case 'import':
            try {
                ret = hdUtil.importMnemonic(payload.phrase, payload.pwd)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: !!ret })
            break

        case 'reset':
            try {
                fs.rmdirSync(path.join(setting.userDataPath, 'Db'))

                sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: true })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_PHRASE, [action, id].join('#')].join('_'), event, { err: err, data: false })
            }

            break
    }
})

ipc.on(ROUTE_WALLET, async (event, actionUni, payload) => {
    let err
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'lock':
            try {
                hdUtil.deleteHDWallet()
                hdUtil.deleteKeyStoreWallet()
                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: true })

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: false })
            }

            break
        case 'unlock':
            let phrase
            try {
                phrase = hdUtil.revealMnemonic(payload.pwd)
                hdUtil.initializeHDWallet(phrase)
                // create key file wallet
                hdUtil.newKeyStoreWallet(phrase)
                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: true })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: false })
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

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: pubKey })
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

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: pubKey })
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

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: ret })
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
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: sig })
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

            sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: data })
            break
    }
})

ipc.on(ROUTE_ADDRESS, async (event, actionUni, payload) => {
    let err, address, nonce
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'get':
            try {
                address = await hdUtil.getAddress(payload.walletID, payload.chainType, payload.start, payload.end)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: address })
            break

        case 'getOne':
            try {
                address = await hdUtil.getAddress(payload.walletID, payload.chainType, payload.path)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: address })
            break

        case 'getNonce':
            try {
                // nonce = await ccUtil.getNonceByLocal(payload.addr, payload.chainType)
                nonce = await ccUtil.getNonce(payload.addr, payload.chainType, payload.includePending)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: nonce })
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

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: balance })
            break

        case 'isWanAddress':
            let ret;
            try {
                ret = await ccUtil.isWanAddress(payload.address);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'fromKeyFile':
            const { keyFilePwd, hdWalletPwd, keyFilePath } = payload
            const keyFileContent = fs.readFileSync(keyFilePath).toString()

            try {
                hdUtil.importKeyStore(WANBIP44Path, keyFileContent, keyFilePwd, hdWalletPwd)
                let count = hdUtil.getKeyStoreCount(WAN_ID)
                Windows.broadcast('notification', 'keyfilewalletcount', count)

                sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: true })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: false })
            }

            break
    }
})

ipc.on(ROUTE_ACCOUNT, (event, actionUni, payload) => {
    let err, ret
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'create':
            try {
                ret = hdUtil.createUserAccount(payload.walletID, payload.path, payload.meta)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'get':
            try {
                ret = hdUtil.getUserAccount(payload.walletID, payload.path)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_ACCOUNT, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'getAll':
            try {
                ret = hdUtil.getUserAccountForChain(payload.chainID)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break
        case 'update':
            try {
                ret = hdUtil.updateUserAccount(payload.walletID, payload.path, payload.meta)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'delete':
            try {
                ret = hdUtil.deleteUserAccount(payload.walletID, payload.path)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ACCOUNT, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break
    }
})

ipc.on(ROUTE_TX, async (event, actionUni, payload) => {
    let ret, err
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'normal':
            try {
                let { walletID, chainType, symbol, path, to, amount, gasPrice, gasLimit, nonce } = payload
                let from = await hdUtil.getAddress(walletID, chainType, path)

                let input = {
                    "symbol": symbol,
                    "from": '0x' + from.address,
                    "to": to,
                    "amount": amount,
                    "gasPrice": gasPrice,
                    "gasLimit": gasLimit,
                    "BIP44Path": path,
                    "walletID": walletID,
                    "nonce": nonce
                }

                let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(symbol, chainType);
                ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'raw':
            try {
                logger.info('Send raw transaction', payload)
                ret = await ccUtil.sendTrans(payload.raw, payload.chainType)
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        /**
         * tx = {
         *   from: from,
         *   to: to,
         *   value: value,
         *   data: data,
         *   gas: defaultGas
         * }
         */
        case 'estimateGas':
            try {
                ret = await ccUtil.estimateGas(payload.chainType, payload.tx);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break;

        case 'showRecords':
            try {
                ret = global.wanDb.queryComm(DB_NORMAL_COLLECTION, (items) => {
                    return items
                })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break;

        case 'insertTransToDB':
            try {
                ccUtil.insertNormalTx(payload.rawTx);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: true })
            break;
    }
})

ipc.on(ROUTE_QUERY, async (event, actionUni, payload) => {
    let ret, err
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'config':
            let { param } = payload

            try {
                let conf
                if (param === 'sdkStatus') {
                    conf = global.chainManager ? 'ready' : 'init'
                } else {
                    conf = setting[`${param}`]
                }

                ret = { [param]: conf }
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_QUERY, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'getGasPrice':
            try {
                ret = await ccUtil.getGasPrice(payload.chainType);
            } catch (err) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_QUERY, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break;
    }

})

ipc.on(ROUTE_STAKING, async (event, actionUni, payload) => {
    let ret, err
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'info':
            try {
                ret = {
                    base: {
                        myStake: "N/A",
                        validatorCnt: "In N/A validators",
                        pendingWithdrawal: "N/A",
                        epochID: "Epoch N/A",
                        epochIDRaw: 0,
                        currentRewardRate: "N/A %",
                        stakePool: 0,
                        currentRewardRateChange: "↑",
                        totalDistributedRewards: "N/A",
                        startFrom: "From " + (new Date()).toDateString(),
                    },
                    list: []
                };

                let totalStake = web3.utils.toBN(0);
                let withdrawStake = web3.utils.toBN(0);
                let validator = [];
                let totalReward = web3.utils.toBN(0);
                for (let i = 0; i < payload.length; i++) {
                    const account = payload[i];
                    const info = await ccUtil.getDelegatorStakeInfo('wan', account.address)

                    console.log('info: ', info)
                    if (info && info.length > 0) {
                        //[{address:"xxxx", amount:3, quitEpoch:0},{address:"xxxxxx", amount:7, quitEpoch:10}]
                        for (let m = 0; m < info.length; m++) {
                            const staker = info[m];
                            totalStake = web3.utils.toBN(staker.amount).add(totalStake);
                            if (staker.quitEpoch != 0) {
                                withdrawStake = web3.utils.toBN(staker.amount).add(withdrawStake);
                            }

                            if (!validator[staker.address]) {
                                validator[staker.address] = web3.utils.toBN(staker.amount);
                            } else {
                                validator[staker.address] = web3.utils.toBN(staker.amount).add(validator[staker.address]);
                            }
                        }
                    }

                    // [{address:"xxxx", amount:3, epochId:0},{address:"xxxxxx", amount:7, epochId:10}]
                    const incentive = await ccUtil.getDelegatorIncentive('wan', account.address)
                    for (let m = 0; m < incentive.length; m++) {
                        const inc = incentive[m];
                        totalReward = web3.utils.toBN(inc.amount).add(totalReward);
                    }
                }

                ret.base.myStake = Number(web3.utils.fromWei(totalStake.toString())).toFixed(0);
                ret.base.pendingWithdrawal = Number(web3.utils.fromWei(withdrawStake.toString())).toFixed(0);
                ret.base.totalDistributedRewards = Number(web3.utils.fromWei(totalReward.toString())).toFixed(2);

                //use Object.getOwnPropertyNames to get length must -1.
                ret.base.validatorCnt = "In " + (Object.getOwnPropertyNames(validator).length - 1) + " validators";

                ret.base.epochIDRaw = await ccUtil.getEpochID('wan');

                let blockNumber = await ccUtil.getBlockNumber('wan');
                let stakerInfo = await ccUtil.getStakerInfo('wan', blockNumber);
                let stakePool = web3.utils.toBN(0)
                if (stakerInfo) {
                    for (let i = 0; i < stakerInfo.length; i++) {
                        const si = stakerInfo[i];
                        stakePool = web3.utils.toBN(si.amount).add(stakePool);
                        for (let m = 0; m < si.clients.length; m++) {
                            const cl = si.clients[m];
                            stakePool = web3.utils.toBN(cl.amount).add(stakePool);
                        }

                        for (let m = 0; m < si.partners.length; m++) {
                            const pr = si.partners[m];
                            stakePool = web3.utils.toBN(pr.amount).add(stakePool);
                        }
                    }
                }

                ret.base.stakePool = Number(web3.utils.fromWei(stakePool.toString())).toFixed(0);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'txHistory':
            try {

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break

        case 'delegateIn':
            try {
                // 1. Get from address from wallet
                let addr = payload;
                console.log('delegateIn from:', payload.account, 'to:', payload.validator, 'value:', payload.value);

                let gasPrice = await ccUtil.getGasPrice('wan');
                let gasLimit = 200000;

                let input = {
                    "from": '0x' + addr.address,
                    "validatorAddr": payload.validator,
                    "amount": payload.value,
                    "gasPrice": gasPrice,
                    "gasLimit": gasLimit,
                    "BIP44Path": addr.path,
                    "walletID": 1
                }

                let ret = await global.crossInvoker.PosDelegateIn(input);
                console.log(JSON.stringify(ret, null, 4));
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break

        case 'delegateOut':
            try {

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break

        case 'txDetail':
            try {

            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break

    }

})

function sendResponse(endpoint, e, payload) {
    const id = e.sender.id
    const senderWindow = Windows.getById(id)
    const { err } = payload

    if (_.isObject(err) || !_.isEmpty(err)) payload.err = errorWrapper(err)
    senderWindow.send('renderer_windowMessage', endpoint, payload)
}

function errorWrapper(err) {
    return { desc: err.message, code: err.errno, cat: err.name }
}
