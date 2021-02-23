import intl from 'react-intl-universal';
import { observable, action, computed, toJS, makeObservable } from 'mobx';
import tokens from './tokens';
import wanAddress from './wanAddress';
import { getInfoByAddress } from 'utils/helper';
import { timeFormat, formatNum, formatNumByDecimals, isSameString } from 'utils/support';
import { TOKEN_PRIORITY } from 'utils/settings';
import { message } from 'antd';

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
            let obj = {
              account: v.fromAccount,
              chain: v.fromChainName,
              chainSymbol: v.fromChainSymbol,
              decimals: v.decimals,
              symbol: v.fromTokenSymbol,
              ancestor: v.ancestorSymbol,
            }
            let key = `${v.fromChainID}-${v.fromAccount}`;
            if (!(key in tokens.tokensList)) {
              obj.select = false;
            } else {
              obj.select = tokens.tokensList[key].select;
            }
            tokens.updateTokensList(key, obj);
            tokens.initTokenIcon(obj);

            // To token
            let key2 = `${v.toChainID}-${v.toAccount}`;
            obj = {
              account: v.toAccount,
              chain: v.toChainName,
              chainSymbol: v.toChainSymbol,
              decimals: v.decimals,
              symbol: v.toTokenSymbol,
              ancestor: v.ancestorSymbol,
            }
            if (!(key2 in tokens.tokensList)) {
              obj.select = false;
            } else {
              obj.select = tokens.tokensList[key2].select;
            }
            tokens.updateTokensList(key2, obj);
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
      if (!this.currSymbol) {
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

  @computed get crossEOSTrans() {
    let trans = [];
    let decimals = this.crossChainSelections[self.currSymbol][0].ancestorDecimals;
    self.crossTrans.forEach((item, index) => {
      if (isSameString(item.tokenSymbol, self.currSymbol) && (item.lockTxHash !== '')) {
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
