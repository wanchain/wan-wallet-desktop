import backend from '~/src/modules/walletBackend'
// import manager from '~/src/modules/wanchainNode/clientBinaryManager'
import windows from '~/src/modules/windows'
import _updater from '~/src/modules/updater'

export const walletBackend = backend

// export const clientBinaryManager = manager

export const Windows = windows

export const updater = _updater

export default { walletBackend, Windows, updater }