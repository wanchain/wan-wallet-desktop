module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'balances', 'getPrivateTxInfo', 'scanMultiOTA', 'isWanAddress', 'fromKeyFile', 'getKeyStoreCount', 'isValidatorAddress' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete' ],
    transaction: [ 'normal', 'private', 'refund', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB' ],
    query: [ 'config', 'getGasPrice' ],
    staking: [ 'getContractAddr', 'info', 'delegateIn', 'delegateOut', 'getContractData', 'insertTransToDB', 'posInfo', 'registerValidator', 'insertRegisterValidatorToDB', 'validatorInfo', 'validatorAppend', 'validatorUpdate', 'getValidatorsInfo', 'getCurrentEpochInfo', 'PosStakeUpdateFeeRate' ],
    setting: ['switchNetwork', 'set', 'get'],
    upgrade: ['start']
}
