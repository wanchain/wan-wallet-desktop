const _ = require('lodash')
const { ipcRenderer, remote: { Menu } } = require('electron')
const routes = require('./routes')
const { postMessage } = require('./util')

module.exports = (function() {
    let instance

    function init() {

        const _callbacks = {}

        function _request(endpoint, payload, cb) {
            if (arguments.length === 2 && typeof arguments[1] === 'function') {
                cb = arguments[1]
            }
    
            const [route, action] = endpoint.split('_')    
            if (_.isEmpty(route && action) || !_.includes(routes[route], action)) {
                return
            }
    
            if (cb) {
                _callbacks[route] =  _callbacks[route] || {}
                _callbacks[route][action] = _callbacks[route][action] || []
                _callbacks[route][action].push(cb)
            }
    
            postMessage({
                _type: 'renderer_makeRequest',
                endpoint,
                payload
            })
        }

        function _wndMsgHandler(event) {
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

            if (_type === 'renderer_windowMessage' 
                || _type === 'renderer_makeRequest'
                // || _type === 'renderer_updateMsg'
                ) 
            {
                if (_type === 'renderer_windowMessage') {
                    const [route, action] = endpoint.split('_')
                    const { err, data } = payload
                    if (_callbacks[route] && !_.isEmpty(_callbacks[route][action])) {
                        _callbacks[route][action].forEach((cb) => cb(err, data))

                        delete _callbacks[route][action]
                    }

                } else if (_type === 'renderer_makeRequest') {
                    const [route, action] = endpoint.split('_') 
                
                    if (_.isEmpty(payload)) {
                        ipcRenderer.send(route, action)
                    } else {
                        ipcRenderer.send(route, action, payload)
                    }

                } 
                // else if (_type === 'renderer_updateMsg') {
                //     window.updateProgress = payload
                // }
            }
        }

        function _contextMenuHandler(event) {
                event.preventDefault();
                Menu
                    .buildFromTemplate([
                        { label: 'Cut', role: 'cut' },
                        { label: 'Copy', role: 'copy' },
                        { label: 'Paste', role: 'paste' },
                        { label: 'Select All', role: 'selectall' },
                    ])
                    .popup()
        } 

        return {
            request: function(endpoint, payload, cb) {
                _request(...arguments)
            },

            wndMsgHandler: function(event) {
                _wndMsgHandler(event)
            },

            contextMenuHandler: function(event) {
                _contextMenuHandler(event)
            }
        }
    }

    return {
        getInstance: function() {
            if (!instance) {
                instance = init()
            }

            return instance
        }
    }

})()


