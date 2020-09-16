import { getGasPrice, increaseFailedRetryCount } from 'utils/helper';
import { REDEEMWETH_GAS, REVOKEETH_GAS, REDEEMETH_GAS, REVOKEWETH_GAS, REDEEMWEOS_GAS } from 'utils/settings'

const MAXTRY = 4;
const DEFAULT_GASPRICE = 1;

const OneStep = {
  pending: {
    redeem: [],
    revoke: []
  },
  sending: new Set(),

  retryTransArr: new Map(),

  initUndoTrans: function (trans) {
    trans.canRedeem.forEach(item => {
      if (!item.redeemTryCount) {
        item.redeemTryCount = 1;
      }
      if (!this.retryTransArr.get(item.hashX)) {
        this.retryTransArr.set(item.hashX, item.redeemTryCount);
      }
      if (!this.pending.redeem.find(val => val.hashX === item.hashX) && this.retryTransArr.get(item.hashX) < MAXTRY) {
        this.pending.redeem.push(item);
      }
    });
    trans.canRevoke.forEach(item => {
      if (!item.revokeTryCount) {
        item.revokeTryCount = 1;
      }
      if (!this.retryTransArr.get(item.hashX)) {
        this.retryTransArr.set(item.hashX, item.revokeTryCount)
      }
      if (!this.pending.revoke.find(val => val.hashX === item.hashX) && this.retryTransArr.get(item.hashX) < MAXTRY) {
        this.pending.revoke.push(item);
      }
    });

    return this;
  },

  handleRedeem: function () {
    // console.log('===============1', this.pending);
    this.pending.redeem.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      this.sending.add(trans_data.hashX);
      if (trans_data.tokenStand === 'TOKEN' || trans_data.tokenStand === 'ETH' || trans_data.tokenStand === 'WAN') {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice(trans_data.srcChainType).then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REDEEMWETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossChain', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                // console.log('crossChain_crossChain:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            });
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REDEEMETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossChain', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                // console.log('crossChain_crossChain:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      } else if (trans_data.tokenStand === 'EOS') {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REDEEMWEOS_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossEOS', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                // console.log('crossChain_crossEOS:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            });
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          wand.request('crossChain_crossEOS', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
            if (err) {
              // console.log('crossChain_crossEOS:', err);
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
            }
          })
        }
      } else if (['WAN', 'BTC'].includes(trans_data.chain)) {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
        }
        if (trans_data.chain === 'BTC') {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gas = REDEEMWETH_GAS;
            input.gasPrice = gasPrice;
            // console.log('Redeem BTC:', trans_data)
            wand.request('crossChain_crossBTC', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          wand.request('crossChain_crossBTC', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType }, (err, ret) => {
            if (err) {
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
            }
          })
        }
      }
    });

    return this;
  },

  handleRevoke: function () {
    // console.log('===============2', this.pending);
    this.pending.revoke.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      this.sending.add(trans_data.hashX);

      if (trans_data.tokenStand === 'TOKEN' || trans_data.tokenStand === 'ETH' || trans_data.tokenStand === 'WAN') {
        let input = {
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice(trans_data.srcChainType).then(gasPrice => {
            input.gasLimit = REVOKEETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossChain', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            });
          }).catch(e => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          getGasPrice(trans_data.srcChainType).then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossChain', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            })
          }).catch(e => {
            this.sending.delete(trans_data.hashX);
          });
        }
      } else if (trans_data.tokenStand === 'EOS') { // EOS
        let input = {
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        };
        if (trans_data.srcChainType !== 'WAN') {
          wand.request('crossChain_crossEOS', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
            if (err) {
              // console.log('crossChain_crossEOS:', err);
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
            }
          })
        } else {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REDEEMWEOS_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossEOS', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                // console.log('crossChain_crossEOS:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            });
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      } else if (['WAN', 'BTC'].includes(trans_data.chain)) { // if (['WAN', 'BTC'].includes(trans_data.tokenStand)) {  // if (['WAN', 'BTC'].includes(trans_data.chain)) { // BTC
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        }
        if (trans_data.tokenStand === 'BTC') {
          input.from = trans_data.from;
          // console.log('BTC revoke:', trans_data)
          wand.request('crossChain_crossBTC', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
            if (err) {
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
            }
          })
        } else {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gas = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossBTC', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }
    })

    return this;
  }
};

export default OneStep;
