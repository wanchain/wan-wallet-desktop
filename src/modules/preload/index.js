const _ = require('lodash')
const { ipcRenderer } = require('electron')
const ENDPOINTs = require('./routes')

ipcRenderer.send('main_setWindowId');

function postMessage(msg) {
    if (typeof msg === 'object') {
        msg = JSON.stringify(msg)
    }

    window.postMessage(msg, (!location.origin || location.origin === "null") ? '*' : location.origin)
}

window.addEventListener('message', function(event) {

    let msg
    try {
        msg = JSON.parse(event.data)
    } catch (e) {
        msg = event.data
    }

    if (typeof msg !== 'object') {
        return 
    }

    const { _type, endpoint, payload } = msg

    if (_type === 'renderer_windowMessage' || _type === 'renderer_makeRequest') {
        if (_type === 'renderer_windowMessage') {

            
            const [route, action] = endpoint.split('_')
            const { err, data } = payload

            if (wand._callbacks[route] && !_.isEmpty(wand._callbacks[route][action])) {
                wand._callbacks[route][action].forEach((cb) => cb(err, data))

                delete wand._callbacks[route][action]
            }

        } else if (_type === 'renderer_makeRequest') {
            const [route, action] = endpoint.split('_') 
           
            if (_.isEmpty(payload)) {
                ipcRenderer.send(route, action)
            } else {
                ipcRenderer.send(route, action, payload)
            }

        }
    }

})

const wand = {
    _callbacks: {},

    isDev: process.env.NODE_ENV === 'development',

    request(endpoint, payload, cb) {
        if (arguments.length === 2 && typeof arguments[1] === 'function') {
            cb = arguments[1]
        }

        const [route, action] = endpoint.split('_')

        if (_.isEmpty(route && action) || !_.includes(ENDPOINTs[route], action)) {
            return
        }

        if (cb) {
            this._callbacks[route] =  this._callbacks[route] || {}
            this._callbacks[route][action] = this._callbacks[route][action] || []
            this._callbacks[route][action].push(cb)
        }

        postMessage({
            _type: 'renderer_makeRequest',
            endpoint,
            payload
        })
    }

}

ipcRenderer.on('renderer_windowMessage', function() {
    postMessage({
        _type: 'renderer_windowMessage',
        endpoint: arguments[1],
        payload: arguments[2]
    })
})

window.wand = wand

