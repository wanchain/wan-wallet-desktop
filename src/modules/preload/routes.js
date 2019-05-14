module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getNonce', 'balance', 'isWanAddress', 'fromKeyFile' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'raw', 'estimateGas', 'showRecords' ],
    query: [ 'config', 'getGasPrice' ]
}
