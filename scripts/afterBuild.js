const os = require('os');

exports.default = function () {
    if(os.type() === 'Windows_NT') {
        return ['upgrade.json'];
    } else {
        return [];
    }
}