module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'importKeyFile'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getNonce', 'balance', 'isWanAddress' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'raw', 'estimateGas', 'showRecords' ],
    query: [ 'config', 'getGasPrice' ]
}
