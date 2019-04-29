require('./ipc')

const _wand = require('./wand').getInstance()

// register handlers for current window
window.addEventListener('message', _wand.wndMsgHandler)
window.addEventListener('contextmenu', _wand.contextMenuHandler)

// expose wand singleton
window.wand = _wand

window.require = process.env.NODE_ENV === 'development' ? require : undefined

