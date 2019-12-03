module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signTransaction', 'setUserTblVersion', 'reboot' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'balances', 'getPrivateTxInfo', 'scanMultiOTA', 'isWanAddress', 'fromKeyFile', 'getKeyStoreCount', 'isValidatorAddress', 'ethBalance', 'isEthAddress', 'btcImportAddress', 'getBtcMultiBalances', 'btcCoinSelect', 'getEOSMultiBalances', 'getEOSResourcePrice' ],
    account: [ 'create', 'get', 'getAll', 'update', 'delete', 'getAccountByPublicKey' ],
    transaction: [ 'normal', 'private', 'refund', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB', 'BTCNormal', 'showBTCRecords', 'EOSNormal' ],
    query: [ 'config', 'getGasPrice' ],
    staking: [ 'getContractAddr', 'info', 'delegateIn', 'delegateOut', 'getContractData', 'insertTransToDB', 'posInfo', 'registerValidator', 'insertRegisterValidatorToDB', 'validatorInfo', 'validatorAppend', 'validatorUpdate', 'getValidatorsInfo', 'getCurrentEpochInfo', 'PosStakeUpdateFeeRate' ],
    setting: ['switchNetwork', 'set', 'get'],
    crossChain: ['getTokensInfo', 'updateTokensInfo', 'updateTokensBalance', 'getTokenInfo', 'addCustomToken', 'getSmgList', 'getHtmlAddr', 'crossBTC', 'crossETH', 'crossE20', 'getAllUndoneCrossTrans', 'increaseFailedRetryCount', 'getAllCrossTrans'],
    upgrade: ['start']
}
