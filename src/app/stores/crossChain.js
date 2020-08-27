import { observable, action, computed, toJS } from 'mobx';
import tokens from './tokens';
import session from './session';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import eosAddress from './eosAddress';
import btcAddress from './btcAddress';
import { getInfoByAddress, getInfoByPath } from 'utils/helper';
import { timeFormat, fromWei, formatNum, formatNumByDecimals, isSameString } from 'utils/support';
import { COIN_ACCOUNT } from 'utils/settings';

class CrossChain {
  @observable currSymbol = '';

  @observable currChainId = '';

  @observable crossTrans = [];

  @observable tokenPairs = {};

  @observable crossChainSelections = {};

  @action setCurrSymbol(symbol) {
    self.currSymbol = symbol;
  }

  @action setCurrChainId(id) {
    self.currChainId = id;
  }

  @action updateCrossTrans() {
    wand.request('crossChain_getAllCrossTrans', null, (err, ret) => {
      if (err) {
        console.log('crossChain_getAllCrossTrans:', err);
      } else {
        self.crossTrans = ret;
      }
    })
  }

  @action getTokenPairs() {
    return new Promise((resolve, reject) => {
      wand.request('crossChain_getTokenPairs', {}, async (err, data) => {
        console.log('getTokenPairs: ', data);
        if (err) {
          console.log('getTokenPairs failed: ', err);
          reject(err)
        } else {
          let tokenPairs = {};
          let ccSelected = {};
          let CcSelectionsFromDB = await this.getCcTokenSelections();

          for (let i = 0; i < data.length; i++) {
            // set tokenPairs
            let v = data[i];
            tokenPairs[v.id] = {
              ancestorDecimals: v.ancestorDecimals,
              ancestorSymbol: v.ancestorSymbol,
              fromAccount: v.fromAccount,
              fromTokenName: v.fromTokenName,
              fromChainID: v.fromChainID,
              fromChainName: v.fromChainName,
              fromChainSymbol: v.fromChainSymbol,
              toChainID: v.toChainID,
              toTokenName: v.toTokenName,
              tokenAddress: v.tokenAddress,
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
              tokenAddress: v.tokenAddress,
              toChainName: v.toChainName,
              toChainSymbol: v.toChainSymbol,
              id: v.id,
              selected: !!CcSelectionsFromDB[v.id]
            });
            this.crossChainSelections = ccSelected;

            // set coinsList & tokensList
            if (v.fromAccount === COIN_ACCOUNT) {
              if (!(v.ancestorSymbol in tokens.coinsList)) {
                tokens.updateCoinsList(v.ancestorSymbol, {
                  chain: v.fromChainName,
                  decimals: v.ancestorDecimals,
                  symbol: v.ancestorSymbol,
                  name: v.fromTokenName,
                  select: false,
                });
              }
            } else {
              if (!(v.fromAccount in tokens.tokensList)) {
                tokens.updateTokensList(v.fromAccount, {
                  chain: v.fromChainName,
                  chainSymbol: v.fromChainSymbol,
                  decimals: v.ancestorDecimals,
                  symbol: v.ancestorSymbol,
                  name: v.fromTokenName,
                  select: false,
                  buddy: v.ancestorSymbol,
                });
              }
            }

            if (!(v.tokenAddress in tokens.tokensList)) {
              tokens.updateTokensList(v.tokenAddress, {
                chain: v.toChainName,
                chainSymbol: v.toChainSymbol,
                decimals: v.ancestorDecimals,
                name: v.toTokenName,
                symbol: v.ancestorSymbol,
                select: false,
                buddy: v.ancestorSymbol,
              });
            }
          }
          resolve();
        }
      })
    })
  }

  @action setCcTokenSelectedStatus(id, selected) {
    wand.request('crossChain_setCcTokenSelectStatus', { id, selected }, (err, data) => {
      if (err) {
        console.log('Update selection status failed.', err);
        this.getTokenPairs();
      }
      this.getTokenPairs();
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
        // console.log('Selections: ', err, data);
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

  @computed get crossChainTokensInfo() {
    return tokens.ccTokens;
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
    return list;
  }

  @computed get crossChainTrans() {
    // console.log('this.currChainId:', this.currChainId);
    const ADDRESSES = { wanAddress, btcAddress, ethAddress };
    let trans = [];
    let decimals = 8;
    let from = this.tokenPairs[this.currChainId].fromChainSymbol;
    let to = this.tokenPairs[this.currChainId].toChainSymbol;
    try {
      decimals = this.crossChainSelections[self.currSymbol][0].ancestorDecimals;
    } catch (err) {
      console.log(err);
    }
    self.crossTrans.forEach((item, index) => {
      if (isSameString(item.tokenSymbol, self.currSymbol) && (item.lockTxHash !== '')) {
        trans.push({
          key: index,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: getInfoByAddress(item.fromAddr, ['name'], ADDRESSES[`${from.toLowerCase()}Address`].addrInfo).name || item.fromAddr,
          fromAddr: item.fromAddr,
          to: getInfoByAddress(item.toAddr, ['name'], ADDRESSES[`${to.toLowerCase()}Address`].addrInfo).name || item.toAddr,
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

  @computed get crossETHTrans() {
    let crossEthTrans = [];
    self.crossTrans.forEach((item, index) => {
      if (item.tokenStand === 'ETH') {
        let fromAddrInfo = item.srcChainAddr === 'WAN' ? wanAddress.addrInfo : ethAddress.addrInfo;
        let toAddrInfo = item.srcChainAddr === 'WAN' ? ethAddress.addrInfo : wanAddress.addrInfo;
        crossEthTrans.push({
          key: index,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: (getInfoByAddress(item.fromAddr, ['name'], fromAddrInfo)).name,
          fromAddr: item.fromAddr,
          to: (getInfoByAddress(item.toAddr, ['name'], toAddrInfo)).name,
          toAddr: item.toAddr,
          value: formatNum(fromWei(item.contractValue)),
          status: item.status,
          sendTime: item.sendTime,
          srcChainAddr: item.srcChainAddr,
          dstChainAddr: item.dstChainAddr,
          lockTxHash: item.lockTxHash,
          redeemTxHash: item.redeemTxHash || 'NULL',
          revokeTxHash: item.revokeTxHash || 'NULL'
        });
      }
    });
    return crossEthTrans.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get crossErc20Trans() {
    // console.log('tokens.formatTokensList:', tokens.formatTokensList);
    // console.log('coins:', tokens.coinsList);
    // console.log('currSymbol:', self.currSymbol);
    let crossEthTrans = [];
    if (!(self.currSymbol in tokens.coinsList)) {
      return [];
    }
    let currTokenInfo = tokens.coinsList[self.currSymbol];
    self.crossTrans.forEach((item, index) => {
      if (isSameString(item.tokenSymbol, self.currSymbol) && (item.lockTxHash !== '')) {
        let fromAddrInfo = item.srcChainAddr === 'WAN' ? wanAddress.addrInfo : ethAddress.addrInfo;
        let toAddrInfo = item.srcChainAddr === 'WAN' ? ethAddress.addrInfo : wanAddress.addrInfo;
        crossEthTrans.push({
          key: index,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: (getInfoByAddress(item.fromAddr, ['name'], fromAddrInfo)).name,
          fromAddr: item.fromAddr,
          to: (getInfoByAddress(item.toAddr, ['name'], toAddrInfo)).name,
          toAddr: item.toAddr,
          value: formatNum(formatNumByDecimals(Number(item.contractValue), currTokenInfo.decimals)),
          status: item.status,
          sendTime: item.sendTime,
          srcChainAddr: item.srcChainAddr,
          dstChainAddr: item.dstChainAddr,
          approveTxHash: item.approveTxHash,
          lockTxHash: item.lockTxHash,
          redeemTxHash: item.redeemTxHash || 'NULL',
          revokeTxHash: item.revokeTxHash || 'NULL',
          srcChainType: item.srcChainType,
          dstChainType: item.dstChainType,
          tokenStand: item.tokenStand
        });
      }
    });
    return crossEthTrans.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get crossBTCTrans() {
    let crossBTCTrans = [];
    Object.values(btcAddress.transHistory).filter(val => val.crossAddress !== undefined).forEach((item, index) => {
      let inbound = item.chain === 'BTC';
      let fromAddrInfo = inbound ? btcAddress.addrInfo : wanAddress.addrInfo;
      let toAddrInfo = inbound ? wanAddress.addrInfo : btcAddress.addrInfo;
      let redeemTxHash = inbound ? `0x${item.refundTxHash}` : item.btcRefundTxHash;
      let revokeTxHash = inbound ? item.btcRevokeTxHash : `0x${item.revokeTxHash}`;

      let fromInfo = getInfoByPath(item.from, fromAddrInfo);
      let toInfo = getInfoByPath(inbound ? item.wanAddress : item.btcCrossAddr, toAddrInfo);
      crossBTCTrans.push({
        key: index,
        hashX: item.hashX,
        storeman: inbound ? wand.btcUtil.hash160ToAddress(item.storeman, 'pubkeyhash', session.chainId === 1 ? 'mainnet' : 'testnet') : item.storeman,
        secret: item.x,
        time: timeFormat(item.time),
        from: fromInfo.name,
        fromAddr: fromInfo.address,
        to: toInfo.name,
        toAddr: toInfo.address,
        value: formatNum(formatNumByDecimals(item.value, 8)),
        status: item.status,
        sendTime: item.time,
        srcChainAddr: item.chain,
        dstChainAddr: item.chain === 'BTC' ? 'WAN' : 'BTC',
        lockTxHash: inbound ? item.btcLockTxHash : `0x${item.lockTxHash}`,
        redeemTxHash: redeemTxHash || 'NULL',
        revokeTxHash: revokeTxHash || 'NULL',
        noticeTxHash: `0x${item.btcNoticeTxhash}` || 'NULL'
      });
    });
    return crossBTCTrans.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get crossEOSTrans() {
    let crossEOSTrans = [];
    let currTokenInfo = Object.values(tokens.formatTokensList).find(item => isSameString(item.symbol, self.currSymbol))
    self.crossTrans.forEach((item, index) => {
      if (isSameString(item.tokenSymbol, self.currSymbol) && (item.lockTxHash !== '')) {
        crossEOSTrans.push({
          key: index,
          hashX: item.hashX,
          storeman: item.storeman,
          secret: item.x,
          time: timeFormat(item.sendTime),
          from: item.srcChainAddr === 'WAN' ? (getInfoByAddress(item.fromAddr, ['name'], wanAddress.addrInfo)).name : item.fromAddr,
          fromAddr: item.fromAddr,
          to: item.srcChainAddr === 'WAN' ? item.toAddr : (getInfoByAddress(item.toAddr, ['name'], wanAddress.addrInfo)).name,
          toAddr: item.toAddr,
          value: formatNum(formatNumByDecimals(item.contractValue, currTokenInfo.decimals)),
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
    return crossEOSTrans.sort((a, b) => b.sendTime - a.sendTime);
  }
}

const self = new CrossChain();
export default self;
