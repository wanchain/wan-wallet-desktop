import { app, BrowserWindow } from 'electron'
import Logger from './utils/Logger'
import { walletCore, hdUtil, ccUtil } from 'wanchain-js-sdk';

const logger = Logger.getLogger('main')

let mainWindow

async function createWindow () {

  const walletBackend = new walletCore({
    "useLocalNode" : false,
    "loglevel" : "debug",
    "MIN_CONFIRM_BLKS" : 0,
    "MAX_CONFIRM_BLKS" : 1000000,
    "network" : "testnet"
  });

  logger.info('start init wallet backend')
  await walletBackend.init()
  logger.info('finish init wallet backend')

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// const testConfig = {
//   pwd: 'wanglu123',
//   chainType: 'WAN',
//   walletID: 1,
//   path: "m/44'/5718350'/0'/0/0",
// }

const generatePhrase = (targetWindow, pwd) => {
  try {
    const phrase = hdUtil.generateMnemonic(pwd);
    logger.info(phrase)
    targetWindow.webContents.send('phrase-generated', phrase)
  } catch (err) {
    logger.error(err.stack)
  }
}

const revealPhrase = (pwd) => {
  let mnemonic;
  try {
    mnemonic = hdUtil.revealMnemonic(pwd);
    logger.info(mnemonic);
  } catch (err) {
    logger.error(err.stack);
  }

  return mnemonic;
}

export { generatePhrase, revealPhrase }

// const validatePhrase = (phrase) => {
//   let ret
//   try {
//     ret = hdUtil.validateMnemonic(phrase);
//     logger.info(ret)
//   } catch (err) {
//     logger.error(err.stack);
//   }

//   return ret;
// }

// const getAddress = async (walletID, chainType, path) => {
//   let address;

//   try {
//     address = await hdUtil.getAddress(walletID, chainType, path);
//   } catch (err) {
//     logger.error(err.stack);
//   } 

//   return address;
// }

// const testHDWallet = async () => {
//     try {
//         const walletBackend = new walletCore({
//             "useLocalNode" : false,
//             "loglevel" : "debug",
//             "MIN_CONFIRM_BLKS" : 0,
//             "MAX_CONFIRM_BLKS" : 1000000,
//             "network" : "testnet"
//           });
      
//         const {pwd, walletID, chainType, path} = testConfig;
        
//         logger.info('start init wallet backend');
//         await walletBackend.init();
//         console.log(global.crossInvoker)
//         logger.info('finish init wallet backend');
//         // const pwd = 'wanglu123';
//         // generatePhrase(pwd);
//         let phrase = revealPhrase(pwd);
//         console.log('phrase: ', phrase);
        
//         validatePhrase(phrase);
//         hdUtil.initializeHDWallet(phrase);
    
//         let addr = await getAddress(walletID, chainType, path);
    
//         logger.info(JSON.stringify(addr))
    
//         const from = '0x' + addr.address;
    
//         const balance = await ccUtil.getWanBalance(from);
    
//         logger.info('balance: ' + balance);
    
//         if (balance) {
//         const input = {
//             symbol: chainType,
//             from: from,
//             to: '0x620b168aD1cBaE2bF69f117AAEC7a0390917b473',
//             amount: 1,
//             gasPrice: 180,
//             gasLimit: 1000000,
//             password: pwd,
//             BIP44Path: path,
//             walletID: walletID
//         }
    
//         let srcChain = global.crossInvoker.getSrcChainNameByContractAddr(chainType, chainType);
        
//         let ret = await global.crossInvoker.invokeNormalTrans(srcChain, input);
    
//         logger.info(JSON.stringify(ret));
//           } else {
//             logger.warn('do not have enough balance');
//           }
//     } catch (err) {
//       logger.error(err.stack);
//     }
//     app.quit();
// } 
