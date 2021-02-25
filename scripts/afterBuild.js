const os = require('os');

exports.default = function () {
    if(os.type() === 'Linux') {
        return ['upgrade.json'];
    } else {
        return [];
    }
}