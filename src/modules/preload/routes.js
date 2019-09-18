module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'isWanAddress', 'fromKeyFile', 'getKeyStoreCount', 'isValidatorAddress', 'ethBalance' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB' ],
    query: [ 'config', 'getGasPrice' ],
    staking: [ 'getContractAddr', 'info', 'delegateIn', 'delegateOut', 'getContractData', 'insertTransToDB', 'posInfo', 'registerValidator', 'validatorInfo', 'validatorAppend', 'validatorUpdate', 'getValidatorsInfo', 'getCurrentEpochInfo', 'PosStakeUpdateFeeRate' ],
    setting: ['switchNetwork', 'set', 'get'],
    crosschain: ['getTokensInfo', 'updateTokensInfo', 'updateTokensBalance', 'getTokenInfo', 'addCustomToken'],
    upgrade: ['start']
}
