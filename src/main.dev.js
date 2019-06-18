/**
 * This is main process of Electron, started as first thing when your 
 * application starts. It runs through entire life of your application.
 * Although this does not have any windows associated, you can open windows from here
 */

import env from 'dotenv'
import { app } from 'electron'
import setting from '~/src/utils/Settings'
import menuFactoryService from '~/src/services/menuFactory'
import i18n, { i18nOptions } from '~/config/i18n'
import Logger from '~/src/utils/Logger'
import windowStateKeeper from 'electron-window-state'
import { Windows, walletBackend, updater } from '~/src/modules'

env.config()

const logger = Logger.getLogger('main')

// register i18n event handlers
i18n.on('languageChanged', () => {
  menuFactoryService.buildMenu(i18n)
  Windows.broadcast('notification', 'language', setting.language)
})

i18n.on('loaded', (loaded) => {
  i18n.changeLanguage(setting.language)
  i18n.off('loaded')
})

i18n.init(i18nOptions, (err) => {
  if (err) {
    logger.error('i18n change language error')
  }
})

let mainWindow

async function createMain () {
  logger.info('creating main window...')

  const mainWindowState = windowStateKeeper({
    defaultWidth: 1440,
    defaultHeight: 768
  });

  mainWindow = Windows.create('main', {
    primary: true,
    electronOptions: {
      minWidth:1440,
      minHeight: 768,
      width: mainWindowState.width,
      height: mainWindowState.height,
      x: mainWindowState.x,
      y: mainWindowState.y,
      webPreferences: {
        nodeIntegration: setting.isDev ? true : false,
        nativeWindowOpen: false,
        preload: setting.isDev ?  `${__dirname}/modules/preload` : `${__dirname}/preload.js`
      }
    }
  })

  mainWindowState.manage(mainWindow.window)
 
  if (setting.isDev) {
    mainWindow.load(`file://${__dirname}/app/index.html`)
  } else {
    mainWindow.load(`file://${__dirname}/index.html`)
  }
  
  // Open the DevTools under development.
  if (setting.isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('ready', () => {
    logger.info('ready to show main window')
    mainWindow.show()
    Windows.broadcast('notification', 'language', setting.language)
    if (global.chainManager) {
      sendReadyNotifications();
    } else {
      Windows.broadcast('notification', 'sdk', 'init')
    }
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function sendReadyNotifications() {
  Windows.broadcast('notification', 'sdk', 'ready')
  Windows.broadcast('notification', 'network', setting.network)
}

// prevent crashed and close gracefully
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION ${err.stack}`)
  app.quit()
})

async function onReady() {
  // 1. initiate windows manager
  Windows.init()

  // 2. register handler for walletbackend init 
  walletBackend.on('initiationDone', async () => {
    sendReadyNotifications()
  })

  // 3. create main window for frontend renderering, hide this window in the first place
  await createMain()
  
  // 4. init wallet sdk
  await walletBackend.init()

  // check updates only if under production mode
  if (process.env.NODE_ENV === 'production') {
    updater.start()
  }
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
    await createMain()
  }
})