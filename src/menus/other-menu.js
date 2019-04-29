import { APP_NAME, LANGUAGES } from '../../config/common'
import setting from '../utils/Settings'
import { app, shell } from 'electron'
import { updater } from '~/src/modules'

export default (i18n) => {
    const menu = []

    // Edit menu
    const editMenu = {
        label: i18n.t('main.applicationMenu.edit.label'),
        submenu: [
            {
                label: i18n.t('main.applicationMenu.edit.undo'),
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
                        click: () => {
                            if (setting.isDev) {
                                app.relaunch({ args: [ '-r', '@babel/register', './src/main.dev.js', '--network', 'main' ] })
                            }
                        
                            app.exit(0)
                        }
                    },
                    {
                        label: i18n.t('main.applicationMenu.setting.network.test'),
                        accelerator: 'Shift+CommandOrControl+P',
                        checked: setting.network === 'testnet',
                        type: 'radio',
                        click: () => {
                            if (setting.isDev) {
                                app.relaunch({ args: [ '-r', '@babel/register', './src/main.dev.js', '--network', 'testnet' ] })
                            }
    
                            app.exit(0)
                        }
                    }
                ]
            },
            {
                label: i18n.t('main.applicationMenu.setting.mode.label'),
                submenu: [
                    {
                        label: i18n.t('main.applicationMenu.setting.mode.full'),
                        accelerator: 'Shift+CommandOrControl+L',
                        checked: setting.mode === 'light',
                        type: 'radio',
                        click: () => {
                            
                        }
                    },
                    {
                        label: i18n.t('main.applicationMenu.setting.mode.light'),
                        accelerator: 'Shift+CommandOrControl+F',
                        checked: setting.mode === 'full',
                        type: 'radio',
                        click: () => {
    
                        }
                    }
                ]
            },
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
                i18n.changeLanguage(languageCode)
            }
        }
    })

    settingMenu.submenu.push({
        label: 'Language',
        submenu: languageMenu
    })
    menu.push(settingMenu)

    // Window menu
    const windowMenu = {
        label: i18n.t('main.applicationMenu.window.label'),
        submenu: [
            {
                label: i18n.t(
                    'main.applicationMenu.window.toggle'
                ),
                accelerator: 'Alt+CommandOrControl+I',
                role: 'toggledevtools'
            },
            { type: 'separator' },
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
            {
                label: i18n.t('main.applicationMenu.app.checkForUpdate'),
                click: updater.run
            },
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

    return menu
}