import { getGasPrice, increaseFailedRetryCount } from 'utils/helper';
import { REDEEMWETH_GAS, REVOKEETH_GAS, REDEEMETH_GAS, REVOKEWETH_GAS } from 'utils/settings'

const MAXTRY = 4;
const DEFAULT_GASPRICE = 180;

const OneStep = {
  pending: {
    redeem: [],
    revoke: []
  },
  sending: new Set(),

  retryTransArr: new Map(),

  initUndoTrans: function(trans) {
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

  handleRedeem: function() {
    this.pending.redeem.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      console.log('handle_redeem_trans_data:', trans_data)
      this.sending.add(trans_data.hashX);
      if (trans_data.tokenStand === 'E20') {
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
            wand.request('crossChain_crossE20', { input, source: 'ETH', destination: 'WAN', type: 'REDEEM', tokenScAddr: trans_data.srcChainAddr }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossE20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              } else {
                console.log('send_redeem_WETH:', ret);
              }
            });
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REDEEMETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossE20', { input, source: 'WAN', destination: 'ETH', type: 'REDEEM', tokenScAddr: trans_data.dstChainAddr }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossE20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              } else {
                console.log('send_redeem_ETH:', ret);
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
              wand.request('crossChain_crossETH', { input, source: 'ETH', destination: 'WAN', type: 'REDEEM' }, (err, ret) => {
                if (err) {
                  this.sending.delete(trans_data.hashX);
                  this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                  increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
                } else {
                  console.log('send_redeem_WETH:', ret);
                }
              })
            }).catch(() => {
              this.sending.delete(trans_data.hashX)
            });
        } else {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REDEEMETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossETH', { input, source: 'WAN', destination: 'ETH', type: 'REDEEM' }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              } else {
                console.log('send_redeem_ETH:', ret);
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
            wand.request('crossChain_crossBTC', { input, source: 'BTC', destination: 'WAN', type: 'REDEEM' }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
              } else {
                console.log('send_redeem_WBTC:', ret);
              }
            })
          }).catch(() => {
            this.sending.delete(trans_data.hashX);
          });
        } else {
          wand.request('crossChain_crossBTC', { input, source: 'WAN', destination: 'BTC', type: 'REDEEM' }, (err, ret) => {
            if (err) {
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.redeemTryCount + 1, isRedeem: true });
            } else {
              console.log('send_redeem_WBTC:', ret);
            }
          })
        }
      }
    });

    return this;
  },

  handleRevoke: function() {
    this.pending.revoke.filter(item => !this.sending.has(item.hashX)).forEach(trans_data => {
      console.log('handle_revoke_trans_data:', trans_data)

      this.sending.add(trans_data.hashX);
      if (trans_data.tokenStand === 'E20') {
        let input = {
          hashX: trans_data.hashX,
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REVOKEETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossE20', { input, source: 'ETH', destination: 'WAN', type: 'REVOKE', tokenScAddr: trans_data.srcChainAddr }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossE20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              } else {
                console.log('send_revoke_token:', ret);
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
            wand.request('crossChain_crossE20', { input, source: 'WAN', destination: 'ETH', type: 'REVOKE', tokenScAddr: trans_data.dstChainAddr }, (err, ret) => {
              if (err) {
                console.log('crossChain_crossE20:', err);
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              } else {
                console.log('send_revoke_token:', ret);
              }
            })
          }).catch(e => {
            this.sending.delete(trans_data.hashX);
          });
        }
      }

      if (trans_data.tokenStand === 'ETH') {
        let input = {
            hashX: trans_data.hashX
        };
        if (trans_data.srcChainType !== 'WAN') {
          getGasPrice('ETH').then(gasPrice => {
            input.gasLimit = REVOKEETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossETH', { input, source: 'ETH', destination: 'WAN', type: 'REVOKE' }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              } else {
                console.log('send_revoke_ETH:', ret);
              }
            });
          }).catch(e => {
            console.log('revokr_eth:', e)
            this.sending.delete(trans_data.hashX)
          });
        } else {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
                gasPrice = DEFAULT_GASPRICE
            }
            input.gasLimit = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossETH', { input, source: 'WAN', destination: 'ETH', type: 'REVOKE' }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              } else {
                console.log('send_revoke_WETH:', ret);
              }
            });
          }).catch(e => {
            console.log('revokr_weth:', e)
            this.sending.delete(trans_data.hashX)
          });
        }
      }

      if (['WAN', 'BTC'].includes(trans_data.chain)) {
        let input = {
          x: trans_data.x,
          hashX: trans_data.hashX,
        }
        if (trans_data.chain === 'BTC') {
          input.from = trans_data.from;
          wand.request('crossChain_crossBTC', { input, source: 'BTC', destination: 'WAN', type: 'REVOKE' }, (err, ret) => {
            if (err) {
              this.sending.delete(trans_data.hashX);
              this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
              increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
            } else {
              console.log('send_revoke_WBTC:', ret);
            }
          })
        } else {
          getGasPrice('WAN').then(gasPrice => {
            if (gasPrice < DEFAULT_GASPRICE) {
                gasPrice = DEFAULT_GASPRICE
            }
            input.gas = REVOKEWETH_GAS;
            input.gasPrice = gasPrice;
            wand.request('crossChain_crossBTC', { input, source: 'WAN', destination: 'BTC', type: 'REVOKE' }, (err, ret) => {
              if (err) {
                this.sending.delete(trans_data.hashX);
                this.retryTransArr.set(trans_data.hashX, this.retryTransArr.get(trans_data.hashX) + 1);
                increaseFailedRetryCount({ transType: 'crossTransBtc', hashX: trans_data.hashX, toCount: trans_data.revokeTryCount + 1, isRedeem: false });
              } else {
                console.log('send_revoke_WBTC:', ret);
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
