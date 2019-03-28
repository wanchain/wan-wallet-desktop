import { app, BrowserWindow, Menu, shell } from 'electron'
import { APP_NAME } from '../config/common'

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
                    label: 'network',
                    submenu: [
                        {
                            label: 'main network',
                            type: 'radio'
                        },
                        {
                            label: 'test network',
                            type: 'radio'
                        }
                    ]
                },
                {
                    label: 'mode',
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