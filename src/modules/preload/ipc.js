const { ipcRenderer } = require('electron')
const { postMessage } = require('./util')

ipcRenderer.on('renderer_windowMessage', function() {
    postMessage({
        _type: 'renderer_windowMessage',
        endpoint: arguments[1],
        payload: arguments[2]
    })
})

ipcRenderer.on('notification', function() {
    postMessage({
        _type: 'renderer_notification',
        endpoint: arguments[1],
        payload: arguments[2]
    })
})

ipcRenderer.on('renderer_updateMsg', function(event, text) {
    window.updateProgress = text
    // postMessage({
    //     _type: 'renderer_updatewMsg',
    //     endpoint: '',
    //     payload: text
    // })
})

ipcRenderer.send('main_setWindowId');

