import intl from 'react-intl-universal';
import { observable, action, computed, toJS, makeObservable } from 'mobx';
import tokens from './tokens';
import wanAddress from './wanAddress';
import { getInfoByAddress } from 'utils/helper';
import { timeFormat, formatNum, formatNumByDecimals, isSameString } from 'utils/support';
import { TOKEN_PRIORITY } from 'utils/settings';
import { message } from 'antd';
import { FNX_POOL_TESTNET } from '../utils/settings';

const FULLNAME = {
  WAN: 'Wanchain',
  ETH: 'Ethereum',
  BTC: 'Bitcoin',
  XRP: 'XRP Ledger'
}

const WASPV2_MAINNET = '0x924fd608bf30db9b099927492fda5997d7cfcb02'
const WASPV2_TESTNET = '0x54a20457a1b1f926c7779245c7f15a9c567ffe01'

class CrossChain {
  @observable currSymbol = '';

  @observable currTokenPairId = '';

  @observable crossTrans = [];

  @observable tokenPairs = {};

  @observable crossChainSelections = {};

  constructor() {
    makeObservable(this);
  }

  @action setCurrSymbol(symbol) {
    this.currSymbol = symbol;
  }

  @action setCurrTokenPairId(id) {
    this.currTokenPairId = id;
  }

  @action updateCrossTrans() {
    wand.request('crossChain_getAllCrossTrans', null, (err, ret) => {
      if (err) {
        console.log('crossChain_getAllCrossTrans:', err);
      } else {
        this.crossTrans = ret;
      }
    })
  }

  @action getTokenPairs() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getTokenPairs', {}, async (err, data) => {
        if (err) {
          console.log('getTokenPairs failed: ', err);
          reject(err)
        } else {
          let tokenPairs = {};
          let ccSelected = {};
          let CcSelectionsFromDB = await this.getCcTokenSelections();
          // Preload tokens' icon which is got from DB file.
          let gotData = data.map(v => [v.fromAccount, v.toAccount]).flat();
          Object.values(tokens.tokensList).forEach(v => {
            if (!gotData.includes(v.account)) {
              tokens.initTokenIcon(toJS(v));
            }
          });

          for (let i = 0; i < data.length; i++) {
            // set tokenPairs
            let v = data[i];
            if (v.ancestorSymbol === 'NS') {
              continue;
            }

            // rewrite for testnet FNX
            if (v.toAccount === FNX_POOL_TESTNET) {
              v.toTokenSymbol = 'FNX'
            }

            tokenPairs[v.id] = {
              ancestorDecimals: v.ancestorDecimals,
              ancestorSymbol: v.ancestorSymbol,
              fromAccount: v.fromAccount,
              fromTokenName: v.fromTokenName,
              fromTokenSymbol: v.fromTokenSymbol,
              fromChainID: v.fromChainID,
              fromChainName: v.fromChainName,
              fromChainSymbol: v.fromChainSymbol,
              toChainID: v.toChainID,
              toTokenName: v.toTokenName,
              toTokenSymbol: v.toTokenSymbol,
              toAccount: v.toAccount,
              toChainName: v.toChainName,
              toChainSymbol: v.toChainSymbol,
            }
            this.tokenPairs = tokenPairs;

            // set crossChainSelections
            if (!(v.ancestorSymbol in ccSelected)) {
              ccSelected[v.ancestorSymbol] = [];
            }
            ccSelected[v.ancestorSymbol].push({
              ancestorDecimals: v.ancestorDecimals,
              ancestorSymbol: v.ancestorSymbol,
              fromAccount: v.fromAccount,
              fromChainID: v.fromChainID,
              fromChainName: v.fromChainName,
              fromChainSymbol: v.fromChainSymbol,
              toChainID: v.toChainID,
              toAccount: v.toAccount,
              toChainName: v.toChainName,
              toChainSymbol: v.toChainSymbol,
              id: v.id,
              selected: !!CcSelectionsFromDB[v.id]
            });
            this.crossChainSelections = ccSelected;

            // From token
            // let obj = {
            //   account: v.fromAccount,
            //   chain: v.fromChainName,
            //   chainSymbol: v.fromChainSymbol,
            //   decimals: v.decimals,
            //   symbol: v.fromTokenSymbol,
            //   ancestor: v.ancestorSymbol,
            // }
            // let key = `${v.fromChainID}-${v.fromAccount}`;
            // if (!(key in tokens.tokensList)) {
            //   obj.select = false;
            // } else {
            //   obj.select = tokens.tokensList[key].select;
            // }
            // tokens.updateTokensList(key, obj);
            // tokens.initTokenIcon(obj);

            // // To token
            // let key2 = `${v.toChainID}-${v.toAccount}`;
            // obj = {
            //   account: v.toAccount,
            //   chain: v.toChainName,
            //   chainSymbol: v.toChainSymbol,
            //   decimals: v.decimals,
            //   symbol: v.toTokenSymbol,
            //   ancestor: v.ancestorSymbol,
            // }
            // if (!(key2 in tokens.tokensList)) {
            //   obj.select = false;
            // } else {
            //   obj.select = tokens.tokensList[key2].select;
            // }
            // tokens.updateTokensList(key2, obj);
            // tokens.initTokenIcon(obj);
          }
          resolve();
        }
      })
    })
  }

  @action getRegisteredTokenList() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getRegisteredTokenList', {}, async (err, data) => {
        if (err) {
          console.log('getRegisteredTokenList failed: ', err);
          reject(err)
        } else {
          let gotData = data.map(v => [v.address]).flat();
          Object.values(tokens.tokensList).forEach(v => {
            if (!gotData.includes(v.account)) {
              tokens.initTokenIcon(toJS(v));
            }
          });
          Object.keys(tokens.tokensList).forEach(i => {
            const val = tokens.tokensList[i]
            let tmp = data.find(v => `${v.chainID}-${v.address}` === i);
            if (!tmp && !val.isCustomToken) {
              tokens.removeTokenItem(i);
            }
          })
          for (let i = 0; i < data.length; i++) {
            const v = data[i];
            let obj;
            if ([WASPV2_MAINNET, WASPV2_TESTNET].includes(v.address.toLowerCase())) {
              obj = {
                account: v.address,
                chain: FULLNAME[v.chainType] || v.chainType,
                chainSymbol: v.chainType,
                decimals: 'WASPv2',
                symbol: 'WASPv2',
                ancestor: 'WASPv2',
              }
            } else {
              obj = {
                account: v.address,
                chain: FULLNAME[v.chainType] || v.chainType,
                chainSymbol: v.chainType,
                decimals: v.decimals,
                symbol: v.symbol,
                ancestor: v.groupTag,
              }
            }
            const key = `${v.chainID}-${v.address}`;
            if (!(key in tokens.tokensList)) {
              obj.select = false;
            } else {
              obj.select = tokens.tokensList[key].select;
            }
            tokens.updateTokensList(key, obj);
            tokens.initTokenIcon(obj);
          }
          resolve();
        }
      })
    })
  }

  @action setCcTokenSelectedStatus(id, selected) {
    if (id === undefined) {
      message.error(intl.get('CrossChain.selectFailed'));
      return;
    }
    wand.request('crossChain_setCcTokenSelectStatus', { id, selected }, (err, data) => {
      if (err) {
        console.log('Failed to update selection status', err);
        message.error(intl.get('CrossChain.selectFailed'));
      } else {
        let target = Object.values(this.crossChainSelections).flat(1).find(obj => obj.id === id);
        if (target) {
          target.selected = selected;
        }
      }
    })
  }

  getChainNameByChainId(chainId) {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getChainInfoByChainId', { chainId: chainId }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    })
  }

  getCcTokenSelections() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getCcTokenSelections', {}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    })
  }

  getCrossChainSelectionInfoById(id) {
    return Object.assign({}, this.tokenPairs[id]);
  }

  @computed get currentTokenPairInfo() {
    return this.tokenPairs[this.currTokenPairId];
  }

  @computed get getCrossChainTokenList() {
    let list = [];
    Object.keys(this.crossChainSelections).forEach(symbol => {
      list.push({
        chain: symbol,
        key: symbol,
        children: this.crossChainSelections[symbol],
      })
    });
    return list.sort((m, n) => {
      return Number(TOKEN_PRIORITY[m.chain] === undefined ? 0 : TOKEN_PRIORITY[m.chain]) > Number(TOKEN_PRIORITY[n.chain] === undefined ? 0 : TOKEN_PRIORITY[n.chain]) ? -1 : 1;
    });
  }

  @computed get crossChainTrans() {
    let trans = [];
    let decimals = 8;
    try {
      if (this.currSymbol.length === 0) {
        return trans;
      }
      decimals = this.crossChainSelections[this.currSymbol][0].ancestorDecimals;
    } catch (err) {
      console.log(err);
    }
    let tokenData = this.tokenPairs[this.currTokenPairId];
    this.crossTrans.forEach((item, index) => {
      if ([tokenData.fromAccount, tokenData.toAccount].includes(item.srcChainAddr) && [tokenData.fromAccount, tokenData.toAccount].includes(item.dstChainAddr) && item.lockTxHash !== '') {
        let fromChainType = item.srcChainType;
        let toChainType = item.dstChainType;
        trans.push({
          key: item.hashX,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: getInfoByAddress(item.fromAddr, ['name'], tokens.getChainAddressInfoByChain(fromChainType)).name || item.fromAddr,
          fromAddr: item.fromAddr,
          to: getInfoByAddress(item.toAddr, ['name'], tokens.getChainAddressInfoByChain(toChainType)).name || item.toAddr,
          toAddr: item.toAddr,
          value: item.srcChainType === 'WAN' && item.tokenSymbol === 'WAN' ? formatNum(formatNumByDecimals(item.value || '0', decimals)) : formatNum(formatNumByDecimals(item.contractValue, decimals)),
          crossValue: item.srcChainType === 'WAN' && item.tokenSymbol === 'WAN' ? formatNum(formatNumByDecimals(item.value || '0', decimals)) : formatNum(formatNumByDecimals(item.contractValue || '0', decimals)),
          crosschainFee: item.crosschainFee,
          receivedAmount: item.receivedAmount ? item.status === 'Redeemed' ? item.receivedAmount : '0' : '',
          status: item.status,
          sendTime: item.sendTime,
          approveTxHash: item.approveTxHash,
          srcChainType: item.srcChainType,
          dstChainType: item.dstChainType,
          lockTxHash: item.lockTxHash,
          redeemTxHash: item.redeemTxHash || 'NULL',
          revokeTxHash: item.revokeTxHash || 'NULL',
          tokenStand: item.tokenStand
        });
      }
    });
    return trans.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get crossEOSTrans() {
    let trans = [];
    if (this.currSymbol.length === 0) {
      return trans;
    }
    let decimals = this.crossChainSelections[this.currSymbol][0].ancestorDecimals;
    this.crossTrans.forEach((item, index) => {
      if (isSameString(item.tokenSymbol, this.currSymbol) && (item.lockTxHash !== '')) {
        trans.push({
          key: index,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: item.srcChainType === 'WAN' ? (getInfoByAddress(item.fromAddr, ['name'], wanAddress.addrInfo)).name : item.fromAddr,
          fromAddr: item.fromAddr,
          to: item.srcChainType === 'WAN' ? item.toAddr : (getInfoByAddress(item.toAddr, ['name'], wanAddress.addrInfo)).name,
          toAddr: item.toAddr,
          value: formatNum(formatNumByDecimals(item.contractValue, decimals)),
          status: item.status,
          sendTime: item.sendTime,
          approveTxHash: item.approveTxHash,
          srcChainType: item.srcChainType,
          dstChainType: item.dstChainType,
          lockTxHash: item.lockTxHash,
          redeemTxHash: item.redeemTxHash || 'NULL',
          revokeTxHash: item.revokeTxHash || 'NULL',
          tokenStand: item.tokenStand
        });
      }
    });
    return trans.sort((a, b) => b.sendTime - a.sendTime);
  }
}

const self = new CrossChain();
export default self;
