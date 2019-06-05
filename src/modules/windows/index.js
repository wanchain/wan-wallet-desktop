import _ from 'lodash'
import { app, BrowserWindow, ipcMain as ipc } from 'electron'
import Logger from '~/src/utils/Logger'
import EventEmitter from 'events'
import setting from '~/src/utils/Settings'
import desktopIdle from 'desktop-idle'

const logger = Logger.getLogger('Windows')

class Window extends EventEmitter {
    constructor(mgr, type, opts) {
        super()

        opts = opts || {}

        this._timer = null
        this._idleChecker = null
        this._mgr = mgr
        this._logger = Logger.getLogger(`${type}Window`)
        this.type = type
        this.isPrimary = !!opts.primary
        this.isPopup = !!opts.isPopup
        this.ownerId = opts.ownerId // the window which creates this new window

        let electronOptions = {
            title: setting.appName,
            show: false,
            width: 1100,
            height: 720,
            acceptFirstMouse: true,
            darkTheme: true,
            webPreferences: {
                webaudio: true,
                webgl: false,
                webSecurity: true,
                textAreasAreResizable: true
            }
        }

        electronOptions = _.merge(electronOptions, opts.electronOptions)

        this._logger.debug('Creating browser window')

        this.window = new BrowserWindow(electronOptions)

        this.session = this.window.webContents.session

        this.webContents = this.window.webContents

        this.window.once('closed', () => {
            this._logger.debug('Closed')
            this.isShown = false
            this.isClosed = true
            this.isContentReady = false
            this.emit('closed')
        })

        this.window.on('blur', () => {
            if (this.type === 'main') {
                if (global.chainManager && !this.isClosed) {
                    if (this._idleChecker) {
                        this._logger.info('main window losing focus, clear idel time checker')
                        try {
                            clearInterval(this._idleChecker)
                            this._logger.info('idle checker cleared')
                        } catch (e) {
                            this._logger.error(e.message || e.stack)
                        }

                        this._idleChecker = null
                    }

                    this._logger.info('main window losing focus, start autolock timer')
                    this._timer = setTimeout(() => {
                        this._logger.info('time out, lock the wallet')
                        this._mgr.broadcast('notification', 'uiAction', 'lockWallet')
                        clearTimeout(this._timer)
                        this._timer = null
                        this._logger.info('autolock timer cleared')
                    }, setting.autoLockTimeout)
                }
            }
        })

        this.window.on('focus', () => {
            if (this.type === 'main') {
                if (this._timer) {
                    this._logger.info('main window getting focus again, clear autolock timer')
                    let timer = this._timer
                    
                    try {
                        clearTimeout(timer)
                        this._logger.info('autolock timer cleared')
                    } catch (e) {
                        this._logger.error(e.message || e.stack)
                    }

                    this._timer = null
                }

                if (global.chainManager) {
                    this._logger.info('start an interval checker for idle time')
                    this._idleChecker = setInterval(() => {
                        let idleTime = desktopIdle.getIdleTime()
                        this._logger.info(`user idle time ${idleTime}`)
                        if (idleTime * 1000 > setting.autoLockTimeout) {
                            this._logger.info('user idle or away from key board, lock the wallet')
                            this._mgr.broadcast('notification', 'uiAction', 'lockWallet')
                            clearInterval(this._idleChecker)
                            this._idleChecker = null
                            this._logger.info('idle check interval cleared')
                        }

                    }, setting.idleCheckInterval)
                }
            }
        })

        this.webContents.once('did-finish-load', () => {
            this.isContentReady = true

            this._logger.debug(`Content loaded, id: ${this.id}`)

            if (opts.sendData) {
                if (_.isString(opts.sendData)) {
                    this.send(opts.sendData)
                } else if (_.isObject(opts.sendData)) {
                    for (const key in opts.sendData) {
                        if ({}.hasOwnProperty.call(opts.sendData, key)) {
                            this.send(key, opts.sendData[key])
                        }
                    }
                }
            }

            if (opts.show) {
                this.show()
            }

            this.emit('ready')
        })

        if (opts.url) {
            this.load(opts.url)
        }
    }

    send() {
        if (this.isClosed) {
            return
        }

        this.webContents.send(...Array.prototype.slice.call(arguments))
    }

    hide() {
        if (this.isClosed) {
            return
        }

        this._logger.debug('Hide')
        this.window.hide()
        this.isShown = false
    }

    load(url) {
        if (this.isClosed) {
            return
        }

        this._logger.debug(`Load URL: ${url}`)

        this.window.loadURL(url)
    }

    show() {
        if (this.isClosed) {
            return
        }

        this.window.show()

        this.isShown = true
    }

    close() {
        if (this.isClosed) {
            return
        }

        this._logger.debug('Close')
        this.window.close()
    }
}

class Windows {
    constructor() {
        this._windows = {}
    }

    init() {
        ipc.on('main_setWindowId', (e) => {
            const id = e.sender.id
            logger.info(`Set window id, ${id}`)
            const bwnd = BrowserWindow.fromWebContents(e.sender)

            const wnd = _.find(this._windows, (w) => {
                return w.window === bwnd
            })

            if (wnd) {
                logger.info(`Set window id=${id}, type=${wnd.type}`)

                wnd.id = id
            }
        })
    }

    create(type, options) {
        options = options || {}

        const existing = this.getByType(type)

        if (existing) {
            logger.debug(`Window ${type} with owner ${options.ownerId} already existing.`)

            return existing
        }

        const category = options.primary ? 'primary' : 'secondary'

        logger.info(`Create ${category} window: ${type}, owner: ${options.ownerId || 'notset'}`)

        const wnd = this._windows[type] = new Window(this, type, options)
        wnd.on('closed', this._onWindowClosed.bind(this, wnd))

        return wnd
    }

    createModal(type, options) {
        options = options || {}

        let opts = {
            show: true,
            ownerId: null,
            electronOptions: {
                width: 1220,
                height: process.platform === 'darwin' ? 720 : 760,
                fullscreen: false,
                center: true,
                useContentSize: true,
                autoHideMenuBar: true,
                webPreferences: {
                    webSecurity: true,
                    preload: setting.isDev ? `${__dirname}/../preload` : `${__dirname}/preload.js`,
                    textAreasAreResizable: false,
                }
            }
        }
        

        const parent = _.find(this._windows, (w) => {
            return w.type === 'main';
        })

        // we need to hide main window when loading window or upgrading window on the top
        if (parent && type !== 'changeNetwork') {
            opts.electronOptions.parent = parent.window
        }

        if (type === 'changeNetwork') {
            opts.electronOptions.frame = false
        }

        const wnd = this.create(type, opts)

        if (setting.isDev) {
            wnd.load(`file://${__dirname}/../../modals/${type}.html`)
        } else {
            wnd.load(`file://${__dirname}/modals/${type}.html`)
        }

        wnd.on('ready', () => {
            wnd.show()
        })

        return wnd
    }

    getByType(type) {
        logger.debug(`Get window by type, ${type}`)

        return _.find(this._windows, (w) => w.type === type)
    }

    getById(id) {
        return _.find(this._windows, (w) => w.id === id )
    }

    broadcast() {
        const data = Array.prototype.slice.call(arguments);

        logger.info(data.join(' '))

        _.each(this._windows, (wnd) => {
            wnd.send(...data)
        })
    }

    _onWindowClosed(wnd) {
        logger.debug(`Removing window from list: ${wnd.type}`)
        let t
        for (t in this._windows) {
            if (this._windows[t] === wnd) {
                delete this._windows[t]

                break
            }
        }

        const anyOpen = _.findKey(this._windows, (wnd) => {
            return wnd.isPrimary && !wnd.isClosed && wnd.isShown
        })

        if (!anyOpen) {
            logger.info('All primary windows closed/invisible')

            if (process.platform !== 'darwin') {
                app.quit()
            }
        }
    }
}

export default new Windows()