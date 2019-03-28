import { app, BrowserWindow, Menu, shell } from 'electron'
import { APP_NAME } from '../config/common'

// const createApplicationMenu = () => {

// }

const template = [
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                role: 'copy'
            },
            {   
                label: 'Paste',
                accelerator: 'CommandOrControl+P',
                role: 'paste'
            }
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Visit Website',
                click() {}
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
            }
        ]
    })
}

export default Menu.buildFromTemplate(template)