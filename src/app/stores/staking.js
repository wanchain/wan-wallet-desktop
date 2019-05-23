import { observable, action, computed, runInAction } from 'mobx';
import axios from 'axios';

import wanAddress from './wanAddress';

import validatorImg from 'static/image/validator.png';
import arrow from 'static/image/arrow.png';

class Staking {
  @observable stakeInfo = {
    myStake: "N/A",
    validatorCnt: "In N/A validators",
    pendingWithdrawal: "N/A",
    epochID: "Epoch N/A",
    currentRewardRate: "N/A %",
    currentRewardRateChange: "↑",
    totalDistributedRewards: "N/A",
    startFrom: "From " + (new Date()).toDateString(),
  };

  @observable stakerList = [];

  rewardRate = 0;
  epochID = 0;

  @action updateStakeInfo() {
    console.log("updateStakeInfo")
    const addrList = wanAddress.getAddrList.slice()
    wand.request('staking_info', addrList, (err, val) => {
      console.log('wand returned.', val)
      if(!err && val) {
        this.stakeInfo = val.base;
        this.stakerList = val.list;
        let reward = this.getYearReward(val.base.epochIDRaw);
        let rewardRateNow = reward * 100 / val.base.stakePool
        this.stakeInfo.currentRewardRate = rewardRateNow.toFixed(2) + '%'
        console.log('rewardRate:', this.stakeInfo.currentRewardRate);
        this.stakeInfo.epochID = "Epoch " + this.stakeInfo.epochIDRaw;

        if (val.base.epochID != this.epochID) {
          if (rewardRateNow > this.rewardRate) {
            this.stakeInfo.currentRewardRateChange = "↑";
          } else if (rewardRateNow < this.rewardRate) {
            this.stakeInfo.currentRewardRateChange = "↓";
          } else {
            this.stakeInfo.currentRewardRateChange = "";
          }
          this.rewardRate = rewardRateNow;
          this.epochID = val.base.epochID;
        }

        console.log('stakeInfo:', this.stakeInfo);
      }
    })
  }

  @computed get stakingList() {
    let validators = []
    let addrList = wanAddress.getAddrList
    for (let i = 0; i < addrList.length; i++) {
      validators.push({
        myAccount: addrList[i].name,
        myStake: { title: "50,000", bottom: "30 days ago" },
        arrow1: arrow,
        validator: { img: validatorImg, name: "Ethereum" },
        arrow2: arrow,
        distributeRewards: { title: "50,000", bottom: "from 50 epochs" },
        modifyStake: ["+", "-"]
      })
    }
    return validators;
  }

  getYearReward(epochID) {
    var epochTime = 1440 * 12 * 10; // slotCount * slotTime
    var epochCountInYear = (365 * 24 * 3600) / epochTime
    var redutionTimes = Math.floor(epochID / epochCountInYear)
    var reduceRate = 0.88

    reduceRate = Math.pow(reduceRate, redutionTimes)
    var yearReward = reduceRate * 2.5e6
    return yearReward
  }
}

const self = new Staking();
export default self;
