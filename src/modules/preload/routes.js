module.exports = {
    phrase: [ 'generate', 'reveal', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signPersonalMessage', 'signTransaction', 'setUserTblVersion', 'reboot' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'balances', 'getPrivateTxInfo', 'scanMultiOTA', 'isWanAddress', 'fromKeyFile', 'getKeyStoreCount', 'isValidatorAddress', 'ethBalance', 'isEthAddress', 'btcImportAddress', 'getBtcMultiBalances', 'btcCoinSelect', 'getEosAccountInfo', 'getEOSResourcePrice' ],
    account: [ 'create', 'get', 'getAllAccounts', 'getAll', 'update', 'delete', 'getAccountByPublicKey', 'setImportedUserAccounts', 'getImportedAccountsByPublicKey' ],
    transaction: [ 'normal', 'private', 'refund', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB', 'BTCNormal', 'showBTCRecords', 'EOSNormal' ],
    query: [ 'config', 'getGasPrice' ],
    staking: [ 'getContractAddr', 'info', 'delegateIn', 'delegateOut', 'getContractData', 'insertTransToDB', 'posInfo', 'registerValidator', 'insertRegisterValidatorToDB', 'validatorInfo', 'validatorAppend', 'validatorUpdate', 'getValidatorsInfo', 'getCurrentEpochInfo', 'PosStakeUpdateFeeRate' ],
    setting: ['switchNetwork', 'set', 'get', 'getDexInjectFile', 'rpcDelay', 'wanNodeDelay', 'ethNodeDelay', 'btcNodeDelay', 'eosNodeDelay'],
    crossChain: ['initRegTokens', 'getTokensInfo', 'getCcTokensInfo', 'updateTokensInfo', 'updateCcTokensInfo', 'updateTokensBalance', 'getTokenInfo', 'addCustomToken', 'deleteCustomToken', 'getSmgList', 'getHtmlAddr', 'crossBTC', 'crossETH', 'crossEOS', 'crossErc20', 'getAllUndoneCrossTrans', 'increaseFailedRetryCount', 'getAllCrossTrans'],
    upgrade: ['start'],
    offline: ['openFile', 'updateNonce', 'buildContract', 'downloadFile', 'deployContractAction']
}
