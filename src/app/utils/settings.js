export const CHAINID = {
  MAIN: 1,
  TEST: 3,
}

export const BTCCHAINID = {
  MAIN: 0,
  TEST: 1,
}

export const WALLETID = {
  NATIVE: 0x01,
  LEDGER: 0x02,
  TREZOR: 0x03,
  KEYSTOREID: 0x05,
  RAWKEY: 0x06,
}

export const TRANSTYPE = {
  tokenTransfer: 'tokenTransfer'
};

export const INBOUND = 'inbound';
export const OUTBOUND = 'outbound';

export const MINDAYS = 7;
export const MAXDAYS = 90;

export const defaultTimeout = '5';

export const DEFAULT_GASPRICE = 180000000000;
export const DEFAULT_GAS = 4700000;

export const REDEEMWEOS_GAS = '250000';
export const LOCKETH_GAS = '1000000';
export const REDEEMWETH_GAS = '250000';
export const REVOKEETH_GAS = '250000';

export const LOCKWEOS_GAS = '600000'
export const LOCKWETH_GAS = '500000';
export const REDEEMETH_GAS = '250000';
export const REVOKEWETH_GAS = '250000';

export const MAIN = 'https://www.wanscan.org';
export const TESTNET = 'https://testnet.wanscan.org';

export const BTCMAIN = 'https://www.blockchain.com/btc';
export const BTCTESTNET = 'https://www.blockchain.com/btc-testnet';

export const ETHMAIN = 'https://etherscan.io';
export const ETHTESTNET = 'https://rinkeby.etherscan.io';

export const BTCPATH_MAIN = "m/44'/0'/0'/0/";
export const BTCPATH_TEST = "m/44'/1'/0'/0/";
export const ETHPATH = "m/44'/60'/0'/0/";
export const EOSPATH = "m/44'/194'/0'/0/";
export const WANPATH = "m/44'/5718350'/0'/0/";

export const STAKEACT = ['StakeIn', 'StakeRegister', 'StakeUpdate', 'StakeAppend', 'StakeUpdateFeeRate'];
export const OSMSTAKEACT = ['Storeman-stakeIn', 'Storeman-stakeAppend', 'Storeman-stakeOut'];
export const OSMDELEGATIONACT = ['Storeman-delegateIn'];
export const storemanGroupStatus = ['none', 'initial', 'curveSeted', 'failed', 'selected', 'ready', 'unregistered', 'dismissed'];

export const X = '0x0000000000000000000000000000000000000000000000000000000000000001';
export const HASHX = '0x0000000000000000000000000000000000000000000000000000000000000002';
export const FAKEVAL = '1';
export const FAKEADDR = '0x0000000000000000000000000000000000000003';
export const FAKESTOREMAN = '0x0000000000000000000000000000000000000004';

export const WALLET_CHAIN = ['WAN', 'BTC', 'ETH', 'EOS'];
// export const WALLET_CHAIN = [];
export const CROSSCHAINTYPE = ['BTC', 'ETH', 'EOS'];
// export const CROSSCHAINTYPE = [];

export const MAX_CONFIRM_BLKS = 100000000;
export const MIN_CONFIRM_BLKS = 0;

export const THIRD_PARTY_OPEN = true;
export const PENALTYNUM = 10000;
export const PRIVATE_TX_AMOUNT_SELECTION = [50000, 5000, 1000, 500, 200, 100, 50, 20, 10];

export const DAPPORDERING = ['DApp.sortByName', 'DApp.sortByDate'];
export const ALLCATEGORIES = 'DApp.allCategories';

export const CROSS_TYPE = ['HTLC', 'FAST'];
export const COIN_ACCOUNT = '0x0000000000000000000000000000000000000000';
