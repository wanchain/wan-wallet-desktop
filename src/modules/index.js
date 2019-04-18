import backend from '~/src/modules/walletBackend'
// import manager from '~/src/modules/wanchainNode/clientBinaryManager'
import windows from '~/src/modules/windows'

export const walletBackend = backend

// export const clientBinaryManager = manager

export const Windows = windows

export default { walletBackend, Windows }