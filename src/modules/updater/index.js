import Logger from '~/src/utils/Logger'
import { dialog } from 'electron'
import setting from '~/src/utils/Settings'
import { autoUpdater } from 'electron-updater'
import { Windows } from '~/src/modules'

const logger = Logger.getLogger('updater')

let updater 
autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {

    logger.error(`autoupdater error: ${(error.stack || error).toString()}`)

    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      title: 'No Updates',
      message: 'Current version is up-to-date.'
    })
    updater.enabled = true
    updater = null
})

function checkForUpdates(menuItem, focusedWindow, event) {
    if (setting.isDev) {
        dialog.showMessageBox({
            title: 'Update Info',
            message: 'Update checker not available under development environment.'
        })

        return
    }
    
    updater = menuItem
    updater.enabled = false
    autoUpdater.checkForUpdates()
}

export default {
    run: checkForUpdates
}

// const logger = Logger.getLogger('updater')
// autoUpdater.logger = logger;
// // autoUpdater.logger.transports.file.level = 'info';

// autoUpdater.on('checking-for-update', () => {
//     logger.info('checking-for-update')
//     sendStatusToWindow('Checking for update...')
// })

// autoUpdater.on('update-available', (info) => {
//     logger.info('update-available')
//     sendStatusToWindow('Update available.')
// })

// autoUpdater.on('update-not-available', (info) => {
//     logger.info('update-not-available')
//     sendStatusToWindow('Update not available.')
// })

// autoUpdater.on('error', (err) => {
//     logger.info('erro in auto-updater')
//     sendStatusToWindow('Error in auto-updater. ' + err)
// })

// autoUpdater.on('download-progress', (progressObj) => {
//     logger.info('download-progress')
//     let log_message = 'Download speed: ' + progressObj.bytesPerSecond
//     log_message = log_message + ' - Download ' + progressObj.percent + '%'
//     log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
//     sendStatusToWindow(log_message)
// })

// autoUpdater.on('update-downloaded', (info) => {
//     logger.info('update-downloaded')
//     sendStatusToWindow('Update downloaded')
//     autoUpdater.quitAndInstall()
// })
  
// function sendStatusToWindow(text) {
//     logger.info(text)
//     const wnd = Windows.getByType('main')
//     wnd.webContents.send('renderer_updateMsg', text);
// }
  
