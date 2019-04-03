import { Menu } from 'electron'
import darwinTemplate from '../menus/darwin-menu'

class MenuFactoryService {
    constructor(menu) {
        this.menu = menu
    }

    buildMenu(app, i18n) {
        if (process.platform === 'darwin') {
            this.menu = Menu.buildFromTemplate(darwinTemplate(app, i18n))
            Menu.setApplicationMenu(this.menu)
        }
    }
}

export default new MenuFactoryService(null)