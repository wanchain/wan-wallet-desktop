import { app, BrowserWindow, Menu, shell } from 'electron'
import { APP_NAME } from '../config/common'
import setting from './utils/Settings'

const createApplicationMenu = () => {
    const template = [
        {
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
        },
        {
            label: 'Setting',
            submenu: [
                {
                    label: 'Network',
                    submenu: [
                        {
                            label: 'main network',
                            accelerator: 'CommandOrControl+Alt+1',
                            checked: setting.network === 'main',
                            type: 'radio',
                            click() {
                                if (process.env.NODE_ENV === 'development') {
                                    app.relaunch({ args: [ '-r', '@babel/register', './src/main.dev.js', '--network', 'main' ] })
                                }
                            
                                app.exit(0)
                            }
                        },
                        {
                            label: 'test network',
                            accelerator: 'CommandOrControl+Alt+1',
                            checked: setting.network === 'testnet',
                            type: 'radio',
                            click() {
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
                            type: 'radio'
                        },
                        {
                            label: 'full',
                            type: 'radio'
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Language',
                    submenu: []
                }
            ],
        },
        {
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
            ],
        },
        {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'Visit Wanchain Official Website',
                    click() {
                        shell.openExternal('https://wanchain.org')
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    click() {}
                }
            ]
        }
    ]
    
    if (process.platform === 'darwin') {
        template.unshift({
            label: `${APP_NAME}`,
            submenu: [
                {
                    label: `About ${APP_NAME}`,
                    role: 'about'
                },
                { type: 'separator' },
                {
                    label: 'Services',
                    role: 'services',
                },
                { type: 'separator' },
                {
                    label: `Hide ${APP_NAME}`,
                    accelerator: 'Command+H',
                    role: 'hide',
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Alt+H',
                    role: 'hideothers',
                },
                {
                    label: 'Show All',
                    role: 'unhide',
                },
                { type: 'separator' },
                {
                    label: `Quit ${APP_NAME}`,
                    accelerator: 'Command+Q',
                    click() { app.quit(); }, // A
                },
            ]
        })

        const windowMenu = template.find(item => item.label === 'Window')
        windowMenu.submenu.push(
            { type: 'separator' },
            {
                label: 'Bring All to Front',
                role: 'front',
            }
        )
    }

    return Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

export default createApplicationMenu