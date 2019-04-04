import { Menu } from 'electron'
import darwinTemplate from '../menus/darwin-menu'
import otherTemplate from '../menus/other-menu'

class MenuFactoryService {
    constructor(menu) {
        this.menu = menu
    }

    buildMenu(i18n) {
        if (process.platform === 'darwin') {
            this.menu = Menu.buildFromTemplate(darwinTemplate(i18n))
        } else {
            this.menu = Menu.buildFromTemplate(otherTemplate(i18n))
        }

        Menu.setApplicationMenu(this.menu)
    }
}

export default new MenuFactoryService(null)