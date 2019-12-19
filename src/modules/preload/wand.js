const _ = require('lodash')
const uuid = require('uuid/v1')
const EventEmitter = require('events')
const { ipcRenderer, remote: { Menu }, clipboard, shell } = require('electron')
const routes = require('./routes')
const { postMessage } = require('./util')
const { btcUtil, ccUtil } = require('wanchain-js-sdk');

module.exports = (function() {
    let instance

    function init() {

        const _callbacks = {}

        const _emitter = new EventEmitter()

        _emitter.setMaxListeners(100)

        function _request(endpoint, payload, cb) {
            if (arguments.length === 2 && typeof arguments[1] === 'function') {
                cb = arguments[1]
            }
    
            const [route, action] = endpoint.split('_')    
            if (_.isEmpty(route && action) || !_.includes(routes[route], action)) {
                return
            }
    
            if (cb) {
                let cbID = uuid()
                _callbacks[route] =  _callbacks[route] || {}
                _callbacks[route][action] = _callbacks[route][action] || {}
                _callbacks[route][action][cbID] = cb
                endpoint = endpoint + '#' + cbID
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
                || _type === 'renderer_notification'
                || _type === 'renderer_updateInfo'
                ) 
            {
                if (_type === 'renderer_windowMessage') {
                    
                    const [route, actionUni] = endpoint.split('_')
                    const [action, cbID] = actionUni.split('#')
                    const { err, data } = payload
                    if (_callbacks[route] && _callbacks[route][action] && _callbacks[route][action][cbID]) {
                        const cb = _callbacks[route][action][cbID]
                        
                        cb(err, data)
                        delete _callbacks[route][action][cbID]
                    }

                } else if (_type === 'renderer_makeRequest') {
                    
                    const [route, action] = endpoint.split('_') 
                
                    if (_.isEmpty(payload)) {
                        ipcRenderer.send(route, action)
                    } else {
                        ipcRenderer.send(route, action, payload)
                    }

                } else if (_type === 'renderer_notification') {

                    _emitter.emit('notification', endpoint, payload)

                } else if (_type === 'renderer_updateInfo') {

                    _emitter.emit('update', endpoint, payload)

                }
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
            },

            writeText: clipboard.writeText,

            emitter: _emitter,

            shell: shell,

            btcUtil: btcUtil,

            ccUtil: ccUtil,

            isDev: process.env.NODE_ENV === 'development'
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


