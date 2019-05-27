import EventEmitter from 'events'
import { Menu } from 'electron'
import setting from '~/src/utils/Settings'
import Logger from '~/src/utils/Logger'
import darwinTemplate from '../menus/darwin-menu'
import otherTemplate from '../menus/other-menu'

class MenuFactoryService extends EventEmitter {
    constructor(menu) {
        super()
        this._logger = Logger.getLogger('MenuFactory')
        this._logger.info('creating menu factory service')
        this.menu = menu
        this._networkMenu = null
    }

    set networkMenu(menuItem) {
        this._networkMenu = menuItem
    }

    get networkMenu() {
        return this._networkMenu
    }

    buildMenu(i18n) {
        this._logger.debug(`building an ${i18n.language} menu on platform ${process.platform}`)
        if (process.platform === 'darwin') {
            this.menu = Menu.buildFromTemplate(darwinTemplate(i18n))
        } else {
            this.menu = Menu.buildFromTemplate(otherTemplate(i18n))
        }

        Menu.setApplicationMenu(this.menu)
        if (setting.language !== i18n.language) {
            setting.switchLang(i18n.language)
        }
    }
}

export default new MenuFactoryService(null)