import backend from '~/src/modules/walletBackend'
import manager from '~/src/modules/wanchainNode/clientBinaryManager'

export const walletBackend = backend

export const clientBinaryManager = manager

export default { walletBackend, clientBinaryManager }