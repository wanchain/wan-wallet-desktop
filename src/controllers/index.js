import fs from 'fs'
import fsExtra from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { ipcMain, app, Menu } from 'electron'
import { hdUtil, ccUtil } from 'wanchain-js-sdk'
import Logger from '~/src/utils/Logger'
import setting from '~/src/utils/Settings'
import Web3 from 'web3';
import { toWei } from '../app/utils/support';

const web3 = new Web3();
import { Windows, walletBackend } from '~/src/modules'
import menuFactoryService from '~/src/services/menuFactory'

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
const ROUTE_SETTING = 'setting'

// db collection consts
const DB_NORMAL_COLLECTION = 'normalTrans'

// wallet path consts
const WANBIP44Path = "m/44'/5718350'/0'/0/"

// chain ID consts
const WAN_ID = 5718350;

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
                fsExtra.removeSync(path.join(setting.userDataPath, 'Db'))
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            app.relaunch()
            app.exit(0)

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
                hdUtil.newKeyStoreWallet(payload.pwd)
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

                logger.info('Sign transaction:');
                logger.info('wallet ID:' + walletID + ', path:' + path + ', raw:' + rawTx);

                try {
                    let ret = await hdWallet.sec256k1sign(path, rawTx);
                    sig.r = '0x' + ret.r.toString('hex');
                    sig.s = '0x' + ret.s.toString('hex');
                    sig.v = '0x' + ret.v.toString('hex');
                    logger.info('Signature:' + JSON.stringify(sig));
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

        case 'deleteLedger':
            {
                try {
                    await hdUtil.disconnectLedger()
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }

                sendResponse([ROUTE_WALLET, [action, id].join('#')].join('_'), event, { err: err, data: true })
                break
            }
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
                logger.info('Nonce: ' + payload.addr + ',' + nonce);
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

        case 'isValidatorAddress':
            try {
                ret = await ccUtil.isWanAddress(payload.address);
                let info = await ccUtil.getValidatorInfo('wan', payload.address);
                if(!info || info.feeRate == 10000) {
                    ret = false;
                }
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'fromKeyFile':
            const { keyFilePwd, hdWalletPwd, keyFilePath } = payload;
            const keyFileContent = fs.readFileSync(keyFilePath).toString();
            const keyStoreObj = JSON.parse(keyFileContent)
            try {
                let path = hdUtil.importKeyStore(`${WANBIP44Path}0`, keyFileContent, keyFilePwd, hdWalletPwd);

                hdUtil.createUserAccount(5, `${WANBIP44Path}${path}`, { name: `Imported${path + 1}`, addr: `0x${keyStoreObj.address}` });
                Windows.broadcast('notification', 'keyfilepath', { path, addr: keyStoreObj.address });

                sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: true })
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e

                sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: false })
            }

            break

        case 'getKeyStoreCount':
            let count;
            try {
                count = hdUtil.getKeyStoreCount(WAN_ID);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_ADDRESS, [action, id].join('#')].join('_'), event, { err: err, data: count })
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

                logger.info('Normal transaction: ' + JSON.stringify(input));

                let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(symbol, chainType);
                ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
                logger.info('Transaction hash: ' + ret);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }

            sendResponse([ROUTE_TX, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'raw':
            try {
                logger.info('Send raw transaction: ' + JSON.stringify(payload))
                ret = await ccUtil.sendTrans(payload.raw, payload.chainType)
                logger.info('Transaction hash: ' + ret);
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
                logger.info('Try to estimate gas: ' + payload.chainType + ',' + JSON.stringify(payload.tx));
                ret = await ccUtil.estimateGas(payload.chainType, payload.tx);
                logger.info('Estimated gas: ' + ret);
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
                logger.info('Gas price: ' + payload.chainType + ',' + ret);
            } catch (e) {
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
                let accounts = payload;
                let delegateInfo = [];
                let incentive = [];
                let epochID = await ccUtil.getEpochID('wan');
                let blockNumber = await ccUtil.getBlockNumber('wan');
                let stakerInfo = await ccUtil.getStakerInfo('wan', blockNumber);

                // let testAddr = '0x7fc2da2C7d17c5F934E424144281023D29c2Fcbd';
                // let testReturn = await ccUtil.getDelegatorIncentive('wan', testAddr);
                // console.log('addr:', testAddr, 'ret:', testReturn);
                // exit(0);

                console.log('accounts.length', accounts.length)
                for (let i = 0; i < accounts.length; i++) {
                    const account = accounts[i];
                    const info = await ccUtil.getDelegatorStakeInfo('wan', account.address);
                    if (info && info.length && info.length > 0) {
                        delegateInfo.push({ account: account, stake: info });
                    }

                    const inc = await ccUtil.getDelegatorIncentive('wan', account.address);
                    console.log('account', account.address, 'incentive.length', inc.length);
                    if (inc && inc.length && inc.length > 0) {
                        console.log('account:', account);
                        console.log('incentive length:', inc.length);
                        incentive.push({ account: account, incentive: inc });
                    }
                }

                ret = { base: {}, list: [] }
                ret.base = buildStakingBaseInfo(accounts, delegateInfo, incentive, epochID, stakerInfo);
                ret.list = buildStakingList(accounts, delegateInfo, incentive, epochID, stakerInfo);
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, [action, id].join('#')].join('_'), event, { err: err, data: ret })
            break

        case 'delegateIn':
            try {
                // 1. Get from address from wallet
                console.log('delegateIn:', payload);

                let tx = payload;

                tx.validatorAddr;

                let validatorInfo = await ccUtil.getValidatorInfo('wan', tx.validatorAddr);
                if (!validatorInfo || validatorInfo.feeRate == 10000) {
                    throw new Error('Validator Address is Invalid');
                }

                console.log('validatorInfo', validatorInfo);

                let gasPrice = await ccUtil.getGasPrice('wan');

                let gasLimit = 200000;
                tx.gasPrice = web3.utils.fromWei(gasPrice, 'gwei');;
                tx.gasLimit = gasLimit;

                let ret = await global.crossInvoker.PosDelegateIn(tx);
                console.log(JSON.stringify(ret, null, 4));
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break

        case 'delegateOut':
            try {
                console.log('delegateOut:', payload);

                let tx = payload;
                let gasPrice = await ccUtil.getGasPrice('wan');

                let gasLimit = 200000;
                let gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');;

                let input = {
                    "from": tx.from,
                    "validatorAddr": tx.validator,
                    "amount": 0,
                    "gasPrice": gasPriceGwei,
                    "gasLimit": gasLimit,
                    "BIP44Path": tx.path,
                    "walletID": 1
                }

                let ret = await global.crossInvoker.PosDelegateOut(input);
                console.log(JSON.stringify(ret, null, 4));
            } catch (e) {
                logger.error(e.message || e.stack)
                err = e
            }
            sendResponse([ROUTE_STAKING, action].join('_'), event, { err: err, data: ret })
            break
    }
})

ipc.on(ROUTE_SETTING, async (event, actionUni, payload) => {
    let ret, err
    const [action, id] = actionUni.split('#')

    switch (action) {
        case 'switchNetwork':

            const { choice } = payload
            const mainWin = Windows.getByType('main')
            const switchWin = Windows.getByType('changeNetwork')

            if (choice === 'yes') {
                try {

                    setting.switchNetwork()

                    Windows.broadcast('notification', 'sdk', 'init')

                    await walletBackend.init()

                    Windows.broadcast('notification', 'network', setting.network)
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }
            } else if (choice === 'no') {
                try {
                    const networkMenu = menuFactoryService.networkMenu
                    const targetText = setting.network.includes('main') ? 'Main Network' : 'Test Network'
                    const [targetMenu] = networkMenu.items.filter(i => i.label === targetText)
                    targetMenu.click()
                } catch (e) {
                    logger.error(e.message || e.stack)
                    err = e
                }
            }

            mainWin.show()
            switchWin.close()
            
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

function buildStakingBaseInfo(accounts, delegateInfo, incentive, epochID, stakerInfo) {
    let base = {
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
    };

    let totalStake = web3.utils.toBN(0);
    let withdrawStake = web3.utils.toBN(0);
    let validator = {};
    let totalReward = web3.utils.toBN(0);
    //console.log("delegateInfo length:", delegateInfo.length);
    for (let i = 0; i < delegateInfo.length; i++) {
        const info = delegateInfo[i].stake;
        //console.log("info", info);
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

    for (let i = 0; i < incentive.length; i++) {
        const inc = incentive[i].incentive;
        // [{address:"xxxx", amount:3, epochId:0},{address:"xxxxxx", amount:7, epochId:10}]
        for (let m = 0; m < inc.length; m++) {
            const one = inc[m];
            totalReward = web3.utils.toBN(one.amount).add(totalReward);
        }
    }

    base.myStake = Number(web3.utils.fromWei(totalStake.toString())).toFixed(0);
    base.pendingWithdrawal = Number(web3.utils.fromWei(withdrawStake.toString())).toFixed(0);
    base.totalDistributedRewards = Number(web3.utils.fromWei(totalReward.toString())).toFixed(2);

    base.validatorCnt = "In " + Object.getOwnPropertyNames(validator).length + " validators";

    base.epochIDRaw = epochID;

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

    base.stakePool = Number(web3.utils.fromWei(stakePool.toString())).toFixed(0);

    return base;
}

function buildStakingList(accounts, delegateInfo, incentive, epochID, stakerInfo) {
    let list = [];

    for (let i = 0; i < delegateInfo.length; i++) {
        const di = delegateInfo[i];
        for (let m = 0; m < di.stake.length; m++) {
            const sk = di.stake[m]
            list.push({
                myAccount: di.account.name,
                balance: di.account.balance,
                accountAddress: di.account.address,
                accountPath: di.account.path,
                myStake: { title: web3.utils.fromWei(sk.amount), bottom: "0 days ago" },
                validator: {
                    name: sk.address
                },
                validatorAddress: sk.address,
                distributeRewards: { title: "50,000", bottom: "from 50 epochs" },
                modifyStake: ["+", "-"]
            })
        }
    }

    console.log('list.length', list.length);
    for (let i = 0; i < list.length; i++) {
        let validatorAddress = list[i].validatorAddress;
        let accountAddress = list[i].accountAddress;
        let distributeRewards = web3.utils.toBN(0);
        let epochs = [];

        console.log('incentive.length', incentive.length);
        for (let m = 0; m < incentive.length; m++) {
            const inc = incentive[m];
            //console.log('accountAddress == inc.account.address', accountAddress, inc.account.address);
            if (accountAddress == inc.account.address) {

                console.log('inc.incentive.length', inc.incentive.length);
                for (let n = 0; n < inc.incentive.length; n++) {
                    const obj = inc.incentive[n];

                    //console.log('obj.address.toLowerCase() == validatorAddress.toLowerCase()', obj.address.toLowerCase(), validatorAddress.toLowerCase());
                    if (obj.address.toLowerCase() == validatorAddress.toLowerCase()) {
                        distributeRewards = web3.utils.toBN(obj.amount).add(distributeRewards);
                        console.log('distributeRewards', distributeRewards)
                        if (!epochs.includes(obj.epochId)) {
                            epochs.push(obj.epochId);
                        }
                    }
                }
            }
        }

        console.log('epochs.length', epochs.length)
        if (epochs.length > 0) {
            epochs.sort((a, b) => { return a - b })
            let days = (epochID - epochs[0]) * 2; // 1 epoch last 2 days.
            list[i].myStake.bottom = days + " days ago";
        } else {
            list[i].myStake.bottom = "Less than 2 days ago";
        }

        list[i].distributeRewards = { title: Number(web3.utils.fromWei(distributeRewards)).toFixed(2), bottom: ("from " + epochs.length + " epochs") };
        console.log('list[i].distributeRewards', list[i].distributeRewards);
    }

    return list;
}
