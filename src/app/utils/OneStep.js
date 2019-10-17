import { getGasPrice, increaseFailedRetryCount } from 'utils/helper';
import { DEFAULT_GASPRICE, REDEEMWETH_GAS, REVOKEETH_GAS, REDEEMETH_GAS, REVOKEWETH_GAS } from 'utils/settings'

const MAXTRY = 4;

const OneStep = {
  pending: {
    redeem: [],
    revoke: []
  },
  sending: new Set(),

  retryTransArr: new Map(),

  initUndoTrans: trans => {
    trans.canRedeem.forEach(item => {
      if (!this.retryTransArr.get(item.hashX)) {
        this.retryTransArr.set(item.hashX, item.redeemTryCount);
      }
      if (this.retryTransArr.get(item.hashX) < MAXTRY) {
        this.pending.redeem.push(item);
      }
    });
    trans.canRevoke.forEach(item => {
      if (!this.retryTransArr.get(item.hashX)) {
        this.retryTransArr.set(item.hashX, item.revokeTryCount)
      }
      if (this.retryTransArr.get(item.hashX) < MAXTRY) {
        this.pending.revoke.push(item);
      }
    });

    return this;
  },

  handleRedeem: () => {
    this.pending.redeem.filter(item => !this.sending.has(item.hashX)).forEach((trans_data) => {
      this.sending.add(trans_data.hashX);
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
              wand.request('crosschain_redeemETHWETH', { input, source: 'ETH', destination: 'WAN' }, (err, ret) => {
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
            wand.request('crosschain_redeemETHWETH', { input, source: 'WAN', destination: 'ETH' }, (err, ret) => {
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
    });
    return this;
  },

  handleRevoke: () => {

  }
};

export default OneStep;
