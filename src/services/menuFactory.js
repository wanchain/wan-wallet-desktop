import { Menu } from 'electron'
import Logger from '~/src/utils/Logger'
import darwinTemplate from '../menus/darwin-menu'
import otherTemplate from '../menus/other-menu'

class MenuFactoryService {
    constructor(menu) {
        this._logger = Logger.getLogger('MenuFactory')
        this._logger.info('creating menu factory service')
        this.menu = menu
    }

    buildMenu(i18n) {
        this._logger.info(`building an ${i18n.language} menu on platform ${process.platform}`)
        if (process.platform === 'darwin') {
            this.menu = Menu.buildFromTemplate(darwinTemplate(i18n))
        } else {
            this.menu = Menu.buildFromTemplate(otherTemplate(i18n))
        }

        Menu.setApplicationMenu(this.menu)
    }
}

export default new MenuFactoryService(null)