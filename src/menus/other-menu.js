import path from 'path'
import { APP_NAME, LANGUAGES } from '../../config/common'
import setting from '../utils/Settings'
import { app, shell } from 'electron'
import { walletBackend, updater, Windows } from '~/src/modules'
import menuFactoryService from '~/src/services/menuFactory'

export default (i18n) => {
    const menu = []

    // Edit menu
    const editMenu = {
        label: i18n.t('main.applicationMenu.edit.label', { app: APP_NAME }),
        submenu: [
            {
                label: i18n.t('main.applicationMenu.edit.undo', { app: APP_NAME }),
                role: 'undo',
            },
            {
                label: i18n.t('main.applicationMenu.edit.redo'),
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.edit.cut'),
                role: 'cut',
            },
            {
                label: i18n.t('main.applicationMenu.edit.copy'),
                role: 'copy'
            },
            {   
                label: i18n.t('main.applicationMenu.edit.paste'),
                role: 'paste'
            },
            {
                label: i18n.t('main.applicationMenu.edit.selectAll'),
                role: 'selectall',
            },
        ]
    }

    menu.push(editMenu)

    // Setting menu
    const settingMenu = {
        label: i18n.t('main.applicationMenu.setting.label'),
        submenu: [
            {
                label: i18n.t('main.applicationMenu.setting.network.label'),
                submenu: [
                    {
                        label: i18n.t('main.applicationMenu.setting.network.main'),
                        accelerator: 'Shift+CommandOrControl+M',
                        checked: setting.network === 'main',
                        type: 'radio',
                        click: async () => {
                            if (!setting.network.includes('main')) {
                                setting.switchNetwork()
                                Windows.broadcast('notification', 'network', setting.network)
                                Windows.broadcast('notification', 'sdk', 'init')
                                await walletBackend.init()
                            }

                            return 
                        }
                    },
                    {
                        label: i18n.t('main.applicationMenu.setting.network.test'),
                        accelerator: 'Shift+CommandOrControl+P',
                        checked: setting.network === 'testnet',
                        type: 'radio',
                        click: async () => {
                            if (setting.network.includes('main')) {
                                setting.switchNetwork()
                                Windows.broadcast('notification', 'network', setting.network)
                                Windows.broadcast('notification', 'sdk', 'init')
                                await walletBackend.init()
                            }

                            return 
                        }
                    }
                ]
            },
            // {
            //     label: i18n.t('main.applicationMenu.setting.mode.label'),
            //     submenu: [
            //         {
            //             label: i18n.t('main.applicationMenu.setting.mode.full'),
            //             accelerator: 'Shift+CommandOrControl+L',
            //             checked: setting.mode === 'light',
            //             type: 'radio',
            //             click: () => {
                            
            //             }
            //         },
            //         {
            //             label: i18n.t('main.applicationMenu.setting.mode.light'),
            //             accelerator: 'Shift+CommandOrControl+F',
            //             checked: setting.mode === 'full',
            //             type: 'radio',
            //             click: () => {
    
            //             }
            //         }
            //     ]
            // },
            { type: 'separator' }
        ],
    }

    // Language menu
    const languageMenu = LANGUAGES.map((languageCode) => {
        return {
            label: i18n.t(`main.applicationMenu.setting.lang.code.${languageCode}`),
            type: 'radio',
            checked: i18n.language === languageCode,
            click: () => {
                if (!setting.language.includes(languageCode)) {
                    i18n.changeLanguage(languageCode)
                    menuFactoryService.emit('menuSetDone')
                }
            }
        }
    })

    settingMenu.submenu.push({
        label: i18n.t(`main.applicationMenu.setting.lang.label`),
        submenu: languageMenu
    })
    menu.push(settingMenu)

    // Window menu
    const windowMenu = {
        label: i18n.t('main.applicationMenu.window.label'),
        submenu: [
            {
                label: i18n.t('main.applicationMenu.window.fullscreen'),
                // accelerator: platformAdapter({
                //     darwin: 'CommandOrControl+F',
                //     default: 'F11',
                // }),
                accelerator: 'CommandOrControl+F',
                role: 'toggleFullScreen'
            },
            {
                label: i18n.t('main.applicationMenu.window.minimize'),
                accelerator: 'CommandOrControl+M',
                role: 'minimize',
            },
            {
                label: i18n.t('main.applicationMenu.window.close'),
                accelerator: 'CommandOrControl+W',
                role: 'close',
            },
            { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.window.front'),
                role: 'front',
            }
        ],
    }
    menu.push(windowMenu)

    // Help menu
    const helpMenu = {
        label: i18n.t('main.applicationMenu.help.label'),
        role: 'help',
        submenu: [
            // {
            //     label: i18n.t('main.applicationMenu.app.checkForUpdate'),
            //     click: updater.run
            // },
            // { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.help.web'),
                click: () => {
                    shell.openExternal(i18n.t('main.applicationMenu.help.webURL'))
                }
            },
            {
                label: i18n.t('main.applicationMenu.help.explorer'),
                click: () => {
                    shell.openExternal(i18n.t('main.applicationMenu.help.explorerURL'))
                }
            }
        ]
    }
    menu.push(helpMenu)

    const developerMenu = {
        label: i18n.t('main.applicationMenu.app.developer.label'),
        submenu: [
            {
                label: i18n.t('main.applicationMenu.app.developer.assets.label'),
                submenu: [
                    {
                        label: i18n.t('main.applicationMenu.app.developer.assets.wan.label'),
                        submenu: [
                            {   
                                label: i18n.t('main.applicationMenu.app.developer.assets.wan.import'),
                                click: () => {

                                    Windows.createModal('importKeyFile', {
                                        width: 1200, height: 800, alwaysOnTop: true
                                    })
                                }
                            }
                        ]
                    }
                ]
            },
            { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.app.developer.data.label'),
                submenu: [
                    {
                        label: i18n.t('main.applicationMenu.app.developer.data.db'),
                        click: () => {
                            const dataDir = setting.userDataPath
                            shell.showItemInFolder(path.join(dataDir, 'Db'))
                        }
                    },
                    {
                        label: i18n.t('main.applicationMenu.app.developer.data.log'),
                        click: () => {
                            const logDir = setting.appLogPath
                            shell.showItemInFolder(logDir)
                        }
                    }
                ]
            },
            { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.app.quit', { app: APP_NAME }),
                click() { app.quit() }
            },
            { type: 'separator' },
            {
                label: i18n.t('main.applicationMenu.help.toggle'),
                accelerator: 'Alt+CommandOrControl+I',
                role: 'toggledevtools'
            }
        ]
    }   

    menu.unshift(developerMenu)

    return menu
}