module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getNonce', 'balance' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'raw', 'getGasLimit' ],
    query: [ 'config', 'getGasPrice' ]
}