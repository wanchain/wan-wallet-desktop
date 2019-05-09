/**
 * This is main process of Electron, started as first thing when your 
 * application starts. It runs through entire life of your application.
 * Although this does not have any windows associated, you can open windows from here
 */

import { app, ipcMain as ipc } from 'electron'
import { autoUpdater } from 'electron-updater'
// import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 
// 'electron-devtools-installer'
import { WDS_PORT } from '~/config/common'
import setting from '~/src/utils/Settings'
import menuFactoryService from '~/src/services/menuFactory'
import i18n, { i18nOptions } from '~/config/i18n'
import Logger from '~/src/utils/Logger'
import windowStateKeeper from 'electron-window-state'
import { Windows, walletBackend } from '~/src/modules'

const logger = Logger.getLogger('main')
autoUpdater.logger = logger

if (!i18n.isIintialized) {
  menuFactoryService.on('menuSetDone', () => {
    Windows.broadcast('notification', 'language', setting.language)
  })
  
  i18n.init(i18nOptions, (err) => {
    if (err) {
      logger.error('i18n change language error')
    }
  })
}

i18n.on('loaded', (loaded) => {
  i18n.changeLanguage(setting.language)
  i18n.off('loaded')
})

i18n.on('languageChanged', (lng) => {
  menuFactoryService.buildMenu(i18n)
})

let mainWindow

async function createWindow () {
  logger.info('creating main window')

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1024 + 208,
    defaultHeight: 720
  });

  mainWindow = Windows.create('main', {
    electronOptions: {
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      webPreferences: {
        /** TODO */
        nodeIntegration: true,
        nativeWindowOpen: false,
        preload: setting.isDev ?  `${__dirname}/modules/preload` : `${__dirname}/preload.js`
      }
    }
  })

  mainWindowState.manage(mainWindow.window)
 
  // mainWindow.load(`file://${__dirname}/app/index.html`)
  // PLEASE DO NOT REMOVE THIS LINE, IT IS RESERVED FOR PACKAGE TEST
  // mainWindow.load(`file://${__dirname}/index.html#v${app.getVersion()}`)

  if (setting.isDev) {
    mainWindow.load(`file://${__dirname}/cases/mainTest.html`)
  } else {
    mainWindow.load(`file://${__dirname}/index.html`)
  }
  
  // Open the DevTools under development.
  if (setting.isDev) {
    installExtensions()
  }

  mainWindow.on('ready', () => {
    logger.info('showing main window')
    menuFactoryService.emit('menuSetDone')
    mainWindow.show()
    // if (!setting.isDev) {
    //   registerAutoUpdaterHandlersAndRun()
    // }
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
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
  // installExtension(REACT_DEVELOPER_TOOLS)
    // .then(name => logger.debug(`Added Extension:  ${name}`))
    // .catch(err => logger.debug('An error occurred: ', err));

  // installExtension(REDUX_DEVTOOLS)
  //   .then(name => logger.debug(`Added Extension:  ${name}`))
  //   .catch(err => logger.debug('An error occurred: ', err));
}

// prevent crashed and close gracefully
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION ${err.stack}`)
  app.quit()
})

async function onReady() {
  Windows.init()
  walletBackend.on('initiationDone', () => {
    Windows.broadcast('notification', 'network', setting.network)
  })
  await createWindow()
  await walletBackend.init()
 
}

// This method will be called when Electron has done everything 
// initialization and ready for creating browser windows
app.on('ready', onReady)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async function () {
  if (mainWindow === null) {
    await createWindow()
  }
})

