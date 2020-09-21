module.exports = {
    phrase: [ 'generate', 'reveal', 'checkPwd', 'has', 'import', 'reset'],
    wallet: [ 'lock', 'unlock', 'getPubKey', 'connectToLedger', 'deleteLedger', 'isConnected', 'getPubKeyChainId', 'signPersonalMessage', 'signTransaction', 'setUserTblVersion', 'reboot', 'exportPrivateKeys', 'importPrivateKey' ],
    address: [ 'get', 'getOne', 'getNonce', 'balance', 'balances', 'getPrivateTxInfo', 'scanMultiOTA', 'isWanAddress', 'fromKeyFile', 'getKeyStoreCount', 'isValidatorAddress', 'ethBalance', 'isEthAddress', 'btcImportAddress', 'getBtcMultiBalances', 'btcCoinSelect', 'getEosAccountInfo', 'getEOSResourcePrice', 'getRamPrice', 'isEosPublicKey', 'isEosNameExist', 'getNewPathIndex', 'getNewNameForNativeAccount', 'isValidPrivateKey' ],
    account: [ 'create', 'get', 'getAllAccounts', 'getAll', 'update', 'delete', 'getAccountByPublicKey', 'setImportedUserAccounts', 'getImportedAccountsByPublicKey', 'getAccountStakeInfo', 'deleteEOSImportedAccounts' ],
    transaction: [ 'normal', 'private', 'refund', 'raw', 'estimateGas', 'showRecords', 'insertTransToDB', 'BTCNormal', 'showBTCRecords', 'EOSNormal', 'tokenNormal' ],
    query: [ 'config', 'getGasPrice' ],
    staking: [ 'getContractAddr', 'info', 'delegateIn', 'delegateOut', 'getContractData', 'insertTransToDB', 'posInfo', 'registerValidator', 'insertRegisterValidatorToDB', 'validatorInfo', 'validatorAppend', 'validatorUpdate', 'getValidatorsInfo', 'getCurrentEpochInfo', 'PosStakeUpdateFeeRate' ],
    setting: ['switchNetwork', 'set', 'get', 'updateDapps', 'getDapps', 'getDAppInjectFile', 'rpcDelay', 'wanNodeDelay', 'ethNodeDelay', 'btcNodeDelay', 'eosNodeDelay'],
    crossChain: ['initRegTokens', 'getCoinsInfo', 'getTokensInfo', 'getCcTokensInfo', 'getTokenPairs', 'getChainInfoByChainId', 'getCcTokenSelections', 'setCcTokenSelectStatus', 'updateCoinsInfo', 'updateTokensInfo', 'updateCcTokensInfo', 'updateTokensBalance', 'getTokenInfo', 'addCustomToken', 'deleteCustomToken', 'getSmgList', 'getStoremanGroupList', 'getStoremanGroupListByChainPair', 'getHtmlAddr', 'crossChain', 'crossBTC', 'crossETH', 'crossEOS', 'crossEOS2WAN', 'getAllUndoneCrossTrans', 'increaseFailedRetryCount', 'getAllCrossTrans', 'getRegisteredOrigToken', 'getMintQuota', 'getBurnQuota'],
    dappStore: ['getRegisteredDapp', 'getRegisteredAds'],
    upgrade: ['start'],
    storeman: ['getStoremanConf', 'getStoremanDelegatorTotalIncentive', 'getStoremanStakeTotalIncentive', 'getStoremanDelegators', 'openStoremanAction', 'getContractData', 'insertStoremanTransToDB', 'getOpenStoremanGroupList', 'getStoremanStakeInfo', 'getStoremanDelegatorInfo', 'getStoremanGroupMember', 'getStoremanCandidates'],
  }
