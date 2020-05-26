import { app, ipcMain as ipc, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import Logger from '~/src/utils/Logger'
import Settings from '~/src/utils/Settings'
import Windows from '~/src/modules/windows'
import i18n from '~/config/i18n'

class WalletUpdater {
  constructor() {
    this.updater = autoUpdater

    this._logger = Logger.getLogger('updater')
    this.updater.logger = this._logger

    // config updater
    this.updater.fullChangelog = true
    this.updater.autoInstallOnAppQuit = false
    this.updater.autoDownload = false
    this.updater.allowDowngrade = false
    this.updater.allowPrerelease = false
    this.updater.isManualCheckUpdates = false
  }

  start() {
    if (process.env.NODE_ENV === 'development') {
        return
    }

    let updateModal

    ipc.on('upgrade', (event, actionUni, payload) => {
      let ret, err
      const [action, id] = actionUni.split('#')

      switch (action) {
        case 'start':
          let choice = parseInt(payload.choice)
          this._logger.info(`user update choice ${choice}`)

          if (choice === 1) { // update
            this.updater
              .downloadUpdate()
              .catch(err => this._logger.error(err.message || err.stack))
          } else if (choice === 0) { // No
            try {
              updateModal.close()
            } catch (e) {
              this._logger.error(`error inside updater: ${err.stack}`)
            }
          } else if (choice === 2) { // skip this version
            try {
              Settings.skipUpdateVersion(payload.version);
              updateModal.close();
            } catch (e) {
              this._logger.error(`error inside updater: ${err.stack}`)
            }
          }
          break;
      }
    });

    this.updater.on('checking-for-update', () => {
      this._logger.info('Checking for updates...')
    });

    this.updater.on('update-available', (info) => {
      this._logger.info(`New version: ${info.version}`);
      this._logger.info(`skipped version: ${Settings.skippedUpdateVersion}`);
      if (Settings.skippedUpdateVersion === info.version && !this.updater.isManualCheckUpdates) {
        return false;
      }
      updateModal = Windows.createModal('systemUpdate', {
        width: 1024 + 208,
        height: 720,
        alwaysOnTop: true
      })
      this.updater.isManualCheckUpdates = false;
      
      const releaseNote = info.releaseNotes[0].note.split('<table>')[0]
      const updateInfo = {
        currVersion: app.getVersion(),
        releaseVersion: info.version,
        releaseDate: new Date(info.releaseDate),
        releaseNotes: releaseNote,
        releasePlatform: process.platform
      }

      updateModal.on('ready', () => {
        updateModal.webContents.send('updateInfo', 'versionInfo', JSON.stringify(updateInfo))
      })
    })

    this.updater.on('update-not-available', (info) => {
      this._logger.info(`Is manual checking for updates: ${this.updater.isManualCheckUpdates}`);
      if (!this.updater.isManualCheckUpdates) {
        return;
      }
      dialog.showMessageBox({
        title: i18n.t('main.updatesUnavailableDialog.title'),
        type: 'info',
        message: i18n.t('main.updatesUnavailableDialog.message')
      });

      this._logger.info(`Update not available: ${JSON.stringify(info)}`);
    })

    this.updater.on('error', (err) => {
      this._logger.error(`updater error: ${err.stack}`)
    })
    this._logger.info(`platform:  ${process.platform}`);
    if (process.platform === 'darwin' || process.platform === 'win32') {
      this.updater.on('download-progress', (progressObj) => {
        let logMsg = 'Download speed: ' + Math.ceil(progressObj.bytesPerSecond / 1024) + ' kbps'
        logMsg = logMsg + ' - Download ' + parseFloat(progressObj.percent).toFixed(2) + '%'
        logMsg = logMsg + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
        this._logger.info(`download progress: ${logMsg}`)

        updateModal.webContents.send('updateInfo', 'downloadPercentage', JSON.stringify(progressObj))
      })
    }

    this.updater.on('update-downloaded', (info) => {
      if (process.platform !== 'darwin') updateModal.webContents.send('updateInfo', 'upgradeProgress', 'done')
      setTimeout(() => {
        this.updater.quitAndInstall()
      }, 3 * 1000)
    })

    this.updater.checkForUpdates()
      .catch(err => {
        this._logger.error((err.message || err.stack))
      })
  }
}

export default new WalletUpdater()