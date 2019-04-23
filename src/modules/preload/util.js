module.exports = {
    postMessage: function(msg) {
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg)
        }
    
        window.postMessage(msg, (!location.origin || location.origin === "null") ? '*' : location.origin)
    }
}

