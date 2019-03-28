import { app, BrowserWindow, Menu, shell } from 'electron'
import { APP_NAME } from '../config/common'

console.log(`APP NAME: ${APP_NAME}`)
console.log(app.getName())

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
    }
]

if (process.platform === 'darwin') {
    template.unshift({label: APP_NAME})
}

export default Menu.buildFromTemplate(template)