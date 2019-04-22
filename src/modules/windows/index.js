import _ from 'lodash'
import { app, BrowserWindow, ipcMain as ipc } from 'electron'
import Logger from '~/src/utils/Logger'
import EventEmitter from 'events'
import setting from '~/src/utils/Settings'

const logger = Logger.getLogger('Windows')

class Window extends EventEmitter {
    constructor(mgr, type, opts) {
        super()

        opts = opts || {}

        this._mgr = mgr
        this._logger = Logger.getLogger(type)
        this.type = type
        this.isPrimary = !!opts.primary
        this.isPopup = !!opts.isPopup
        this.ownerId = opts.ownerId // the window which creates this new window

        let electronOptions = {
            title: setting.appName,
            show: false,
            width: 1100,
            height: 720,
            titleBarStyle: 'hiddenInset',
            acceptFirstMouse: true,
            darkTheme: true,
            webPreferences: {
                webaudio: true,
                webgl: false,
                webSecurity: false,
                textAreasAreResizable: true
            }
        }

        electronOptions = _.merge(electronOptions, opts.electronOptions)

        this._logger.debug('Creating browser window')

        this.window = new BrowserWindow(electronOptions)



        this.session = this.window.webContents.session
        this.session.setUserAgent(this.session.getUserAgent(), setting.language)

        this.webContents = this.window.webContents

        this.window.once('closed', () => {
            this._logger.debug('Closed')
            this.isShown = false
            this.isClosed = true
            this.isContentReady = false
            this.emit('closed')
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
        if (this.isClosed || !this.isContentReady) {
            return
        }

        // this._logger.debug(`Sending data ${arguments.toString()}`)

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

        this._logger.debug('Show')

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
        this._windows = new Map()
    }

    init() {
        ipc.on('main_setWindowId', (e) => {
            // const sourceWindow = e.sender.getOwnerBrowserWindow()
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

    getByType(type) {
        logger.debug(`Get window by type, ${type}`)

        return _.find(this._windows, (w) => w.type === type)
    }

    getById(id) {
        logger.debug(`Get window by id, ${id}`)

        return _.find(this._windows, (w) => w.id === id )
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

        const anyOpen = _.find(this._windows, (wnd) => {
            
        })

        if (!anyOpen && process.platform !== 'darwin') {
            logger.info('All primary windows closed/invisible, so quitting app...')

            app.quit()
        }
    }
}

export default new Windows()