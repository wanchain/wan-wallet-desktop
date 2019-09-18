
export const WALLETID = {
  NATIVE: 0x01,
  LEDGER: 0x02,
  TREZOR: 0x03,
  KEYSTOREID: 0x05,
}

export const TRANSTYPE = {
  tokenTransfer: 'tokenTransfer'
};

export const MINDAYS = 7;
export const MAXDAYS = 90;

export const defaultTimeout = '5';

export const DEFAULT_GAS = 4700000;

export const MAIN = 'https://www.wanscan.org';
export const TESTNET = 'https://testnet.wanscan.org';

export const ETHMAIN = 'https://etherscan.io/';
export const ETHTESTNET = 'https://rinkeby.etherscan.io/';

export const ETHPATH = "m/44'/60'/0'/0/";
export const WANPATH = "m/44'/5718350'/0'/0/";

export const STAKEACT = ['StakeIn', 'StakeRegister', 'StakeUpdate', 'StakeAppend', 'StakeUpdateFeeRate'];
