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
    this.pending.redeem.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      this.sending.add(trans_data.hashX);
      if (trans_data.tokenStand === 'TOKEN') {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REDEEMWETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossErc20', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossErc20:', err);
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
            wand.request('crossChain_crossErc20', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossErc20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }

      // Handle Undo ETH Cross Chain Trans
      if (trans_data.tokenStand === 'ETH') {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REDEEMWETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossETH', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX)
          });
        } else {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REDEEMETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossETH', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }

      // Handle Undo WAN Cross Chain Trans
      if (trans_data.tokenStand === 'WAN') {
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
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX)
          });
        } else {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REDEEMETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossChain', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }

      if (['WAN', 'BTC'].includes(trans_data.chain)) {
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
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossBTC', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
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
          input.tokenPairID = trans_data.tokenPairID;
          wand.request('crossChain_crossBTC', { input, type: 'REDEEM', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
            if (err) {
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
            }
          })
        }
      }

      if (trans_data.tokenStand === 'EOS') {
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
                console.log('crossChain_crossEOS:', err);
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
              console.log('crossChain_crossEOS:', err);
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
            }
          })
        }
      }
    });

    return this;
  },

  handleRevoke: function () {
    this.pending.revoke.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      this.sending.add(trans_data.hashX);
      if (trans_data.tokenStand === 'TOKEN') {
        let input = {
          hashX: trans_data.hashX,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REVOKEETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossErc20', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
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
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            input.tokenPairID = trans_data.tokenPairID;
            wand.request('crossChain_crossErc20', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossErc20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            })
          }).catch(e => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }

      if (trans_data.tokenStand === 'ETH') {
        let input = {
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REVOKEETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossETH', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            });
          }).catch(e => {
            console.log('revoke_eth:', e)
            this.sending.delete(trans_data.hashX)
          });
        } else {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
              gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossETH', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            });
          }).catch(e => {
            console.log('revoke_weth:', e)
            this.sending.delete(trans_data.hashX)
          });
        }
      }

      if (trans_data.tokenStand === 'WAN') {
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
            console.log('revoke_wan:', e)
            this.sending.delete(trans_data.hashX)
          });
        } else {
          getGasPrice('WAN').then(gasPrice => {
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
            });
          }).catch(e => {
            console.log('revoke_wan:', e)
            this.sending.delete(trans_data.hashX)
          });
        }
      }

      // if (['WAN', 'BTC'].includes(trans_data.chain)) {
      if (['WAN', 'BTC'].includes(trans_data.tokenStand)) {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        }
        if (trans_data.tokenStand === 'BTC') {
          input.from = trans_data.from;
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

      if (trans_data.tokenStand === 'EOS') {
        let input = {
          hashX: trans_data.hashX,
          tokenPairID: trans_data.tokenPairID,
        };
        if (trans_data.srcChainType !== 'WAN') {
          wand.request('crossChain_crossEOS', { input, type: 'REVOKE', sourceAccount: trans_data.srcChainAddr, sourceSymbol: trans_data.srcChainType, destinationAccount: trans_data.dstChainAddr, destinationSymbol: trans_data.dstChainType, tokenPairID: trans_data.tokenPairID }, (err, ret) => {
            if (err) {
              console.log('crossChain_crossEOS:', err);
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
                console.log('crossChain_crossEOS:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              }
            });
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
