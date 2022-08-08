import { configure } from 'mobx';
import session from './session';
import mnemonic from './mnemonic';
import portfolio from './portfolio';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import eosAddress from './eosAddress';
import btcAddress from './btcAddress';
import xrpAddress from './xrpAddress';
import trxAddress from './trxAddress';
import languageIntl from './languageIntl';
import sendTransParams from './sendTransParams';
import sendCrossChainParams from './sendCrossChainParams';
import staking from './staking';
import tokens from './tokens';
import crossChain from './crossChain';
import dapps from './dapps';
import openstoreman from './openstoreman';

configure({ enforceActions: 'never' });

export default {
  session,
  mnemonic,
  portfolio,
  wanAddress,
  ethAddress,
  eosAddress,
  btcAddress,
  xrpAddress,
  trxAddress,
  sendTransParams,
  sendCrossChainParams,
  staking,
  languageIntl,
  tokens,
  crossChain,
  dapps,
  openstoreman
};
