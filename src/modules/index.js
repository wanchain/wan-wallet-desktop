import _backend from '~/src/modules/walletBackend'
import _updater from '~/src/modules/updater'
import _windows from '~/src/modules/windows'

export const walletBackend = _backend
export const Windows = _windows
export const updater = _updater

export default { walletBackend, Windows, updater }