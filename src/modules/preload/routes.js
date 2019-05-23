module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'isWanAddress', 'fromKeyFile' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB' ],
    query: [ 'config', 'getGasPrice' ]
}
