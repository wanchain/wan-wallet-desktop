import { APP_NAME, LANGUAGES } from '../../config/common'
import setting from '../utils/Settings'

export default (app, i18n) => {
    const menu = []

    // Mac OS menu
    const macMenu = {
        label: `${APP_NAME}`,
        submenu: [
            {
                label: i18n.t('appName'),
                role: 'about'
            },
            { type: 'separator' },
            {
                label: 'Services',
                role: 'services',
            },
            { type: 'separator' },
            {
                label: i18n.t('hideApp'),
                accelerator: 'Command+H',
                role: 'hide',
            },
            {
                label: i18n.t('hideOthers'),
                accelerator: 'Command+Alt+H',
                role: 'hideothers',
            },
            {
                label: i18n.t('showAll'),
                role: 'unhide',
            },
            { type: 'separator' },
            {
                label: i18n.t('quitApp'),
                accelerator: 'Command+Q',
                click() { app.quit() }, 
            },
        ]
    }
    menu.push(macMenu)

    // Edit menu
    const editMenu = {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CommandOrControl+Z',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CommandOrControl+Z',
                role: 'redo',
            },
            { type: 'separator' },
            {
                label: 'Cut',
                accelerator: 'CommandOrControl+X',
                role: 'cut',
            },
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                role: 'copy'
            },
            {   
                label: 'Paste',
                accelerator: 'CommandOrControl+P',
                role: 'paste'
            },
            {
                label: 'Select All',
                accelerator: 'CommandOrControl+A',
                role: 'selectall',
            },
        ]
    }

    menu.push(editMenu)

    // Setting menu
    const settingMenu = {
        label: 'Setting',
        submenu: [
            {
                label: 'Network',
                submenu: [
                    {
                        label: 'main network',
                        accelerator: 'Shift+CommandOrControl+M',
                        checked: setting.network === 'main',
                        type: 'radio',
                        click: () => {
                            if (process.env.NODE_ENV === 'development') {
                                app.relaunch({ args: [ '-r', '@babel/register', './src/main.dev.js', '--network', 'main' ] })
                            }
                        
                            app.exit(0)
                        }
                    },
                    {
                        label: 'test network',
                        accelerator: 'Shift+CommandOrControl+P',
                        checked: setting.network === 'testnet',
                        type: 'radio',
                        click: () => {
                            if (process.env.NODE_ENV === 'development') {
                                app.relaunch({ args: [ '-r', '@babel/register', './src/main.dev.js', '--network', 'testnet' ] })
                            }
    
                            app.exit(0)
                        }
                    }
                ]
            },
            {
                label: 'Mode',
                submenu: [
                    {
                        label: 'light',
                        accelerator: 'Shift+CommandOrControl+L',
                        checked: setting.mode === 'light',
                        type: 'radio',
                        click: () => {
                            
                        }
                    },
                    {
                        label: 'full',
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
            label: i18n.t(languageCode),
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
        label: 'Window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CommandOrControl+M',
                role: 'minimize',
            },
            {
                label: 'Close',
                accelerator: 'CommandOrControl+W',
                role: 'close',
            },
            { type: 'separator' },
            {
                label: 'Bring All to Front',
                role: 'front',
            }
        ],
    }
    menu.push(windowMenu)

    // Help menu
    const helpMenu = {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Visit Wanchain Official Website',
                click: () => {
                    shell.openExternal('https://wanchain.org')
                }
            },
            {
                label: 'Toggle Developer Tools',
                click: () => {}
            }
        ]
    }
    menu.push(helpMenu)

    return menu
}