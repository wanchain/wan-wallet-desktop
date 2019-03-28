import { app, BrowserWindow, Menu, shell } from 'electron'

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
                accelerator: 'CommandOrControl+C',
                role: 'paste'
            }
        ]
    }
]

export default Menu.buildFromTemplate(template)