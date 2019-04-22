/**
 * This is main process of Electron, started as first thing when your 
 * application starts. It runs through entire life of your application.
 * Although this does not have any windows associated, you can open windows from here
 */

import { app, BrowserWindow, ipcMain as ipc } from 'electron'
import { autoUpdater } from 'electron-updater'
import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 
'electron-devtools-installer'
import setting from '~/src/utils/Settings'
import menuFactoryService from '~/src/services/menuFactory'
import i18n, { i18nOptions } from'~/config/i18n'
import Logger from '~/src/utils/Logger'
import windowStateKeeper from 'electron-window-state'
import { walletBackend, Windows } from '~/src/modules'

const logger = Logger.getLogger('main')
autoUpdater.logger = logger

let mainWindow


async function createWindow () {
  logger.info('creating main window')

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024 + 208,
    defaultHeight: 720
  });

  mainWindow = Windows.create('main', {
    electronOptions: {
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: true,
      webPreferences: {
        nodeIntegration: false,
        // contextIsolation: true,
        preload: `${__dirname}/modules/preload`
      }
    }
  })

  mainWindowState.manage(mainWindow.window)

  mainWindow.load(`file://${__dirname}/app/index.html`)
  
  // PLEASE DO NOT REMOVE THIS LINE, IT IS RESERVED FOR PACKAGE TEST
  // mainWindow.loadURL(`file://${__dirname}/index.html#v${app.getVersion()}`)

  // mainWindow.load(`file://${__dirname}/cases/mainTest.html`)
  
  // Open the DevTools.
  if (setting.isDev) {
    installExtensions()
  }

  const cb = (err) => { 
    if (err) {
      console.log(err)
      logger.error('i18n change language error')
    }
  }

  if (!i18n.isIintialized) {
    i18n.init(i18nOptions, cb)
  }

  i18n.on('loaded', (loaded) => {
    i18n.changeLanguage('en')
    i18n.off('loaded')
  })

  i18n.on('languageChanged', (lng) => {
    menuFactoryService.buildMenu(i18n)
  })

  mainWindow.on('ready', () => {
    mainWindow.show()
  })


  // mainWindow.once('ready-to-show', () => {
  //   console.log('\n\n\n\n')
  //   mainWindow.window.show()
  //   logger.info('finish loading main window')
  
  //   if (!setting.isDev) {
  //     registerAutoUpdaterHandlersAndRun()
  //   }
  // })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function sendStatusToWindow(text) {
  logger.info(text)
  mainWindow.webContents.send('message', text)
}

function registerAutoUpdaterHandlersAndRun() {
  autoUpdater.on('checking-for-update', () => {
    logger.info('checking-for-update')
    sendStatusToWindow('Checking for update...')
  })
  
  autoUpdater.on('update-available', (info) => {
    logger.info('update-available')
    sendStatusToWindow('Update available.')
  })
  
  autoUpdater.on('update-not-available', (info) => {
    logger.info('update-not-available')
    sendStatusToWindow('Update not available.')
  })
  
  autoUpdater.on('error', (err) => {
    logger.info('erro in auto-updater')
    sendStatusToWindow('Error in auto-updater. ' + err)
  })
  
  autoUpdater.on('download-progress', (progressObj) => {
    logger.info('download-progress')
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - Download ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    sendStatusToWindow(log_message)
  })
  
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('update-downloaded')
    sendStatusToWindow('Update downloaded')
    autoUpdater.quitAndInstall()
  })

  autoUpdater.checkForUpdates()
}

function installExtensions() {
  mainWindow.webContents.openDevTools()

  // Install extensions
  installExtension(REACT_DEVELOPER_TOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));

  installExtension(REDUX_DEVTOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err));
}

// prevent crashed and close gracefully
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION ${err.stack}`)
  app.quit()
})

async function onReady() {
  Windows.init()
  await walletBackend.init()
  await createWindow()
}

// This method will be called when Electron has done everything 
// initialization and ready for creating browser windows
app.on('ready', onReady)

app.on('window-all-closed', function () {
  // if (process.platform !== 'darwin') {
    app.quit()
  // }
})

// app.on('activate', async function () {
//   console.log('there')
//   if (mainWindow === null) {
//     console.log('here')
//     await createWindow()
//   }
// })

