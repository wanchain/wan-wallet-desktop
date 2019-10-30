import { observable, action, computed, toJS } from 'mobx';

import tokens from './tokens';
import wanAddress from './wanAddress';
import ethAddress from './ethAddress';
import { getInfoByAddress } from 'utils/helper';
import { CROSSCHAINTYPE } from 'utils/settings';
import { timeFormat, fromWei, formatNum } from 'utils/support';

class CrossChain {
  @observable currSymbol = '';

  @observable crossTrans = [];

  @action setCurrSymbol(symbol) {
    self.currSymbol = symbol;
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

  @computed get crossChainTokensInfo () {
    let list = [];
    Object.keys(tokens.tokensList).forEach(item => {
      let val = tokens.tokensList[item];
      if (!CROSSCHAINTYPE.includes(val.symbol) && !val.userAddr) {
        list.push({
          wanAddr: item,
          symbol: val.symbol,
          select: val.ccSelect
        })
      }
    })

    return list.sort((a, b) => a.symbol.codePointAt() - b.symbol.codePointAt())
  }

  @computed get crossChainOnSideBar() {
    let list = [];
    Object.keys(tokens.tokensList).forEach(item => {
      if (tokens.tokensList[item].ccSelect && !CROSSCHAINTYPE.includes(tokens.tokensList[item].symbol)) {
        list.push({
          tokenAddr: item,
          tokenOrigAddr: tokens.tokensList[item].tokenOrigAddr || '',
          symbol: tokens.tokensList[item].symbol
        })
      }
    });
    return list.sort((a, b) => a.symbol.codePointAt() - b.symbol.codePointAt());
  }

  @computed get crossETHTrans () {
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

  @computed get crossE20Trans () {
    let crossEthTrans = [];
    self.crossTrans.forEach((item, index) => {
      if (item.tokenSymbol === self.currSymbol.toUpperCase()) {
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
          revokeTxHash: item.revokeTxHash || 'NULL',
          srcChainType: item.srcChainType === 'WAN' ? 'WAN' : item.tokenSymbol,
          dstChainType: item.srcChainType === 'WAN' ? item.tokenSymbol : 'WAN',
        });
      }
    });
    return crossEthTrans.sort((a, b) => b.sendTime - a.sendTime);
  }
}

const self = new CrossChain();
export default self;
