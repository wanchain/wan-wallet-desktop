
import session from './session';
import mnemonic from './mnemonic';
import portfolio from './portfolio';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import languageIntl from './languageIntl';
import sendTransParams from './sendTransParams';
import sendCrossChainParams from './sendCrossChainParams';
import staking from './staking';
import tokens from './tokens';
import crossChain from './crossChain';

const stores = {
  session,
  mnemonic,
  portfolio,
  wanAddress,
  ethAddress,
  sendTransParams,
  sendCrossChainParams,
  staking,
  languageIntl,
  tokens,
  crossChain
};

export default stores;
