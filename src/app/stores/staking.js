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

  @observable validatorList = [];

  rewardRate = 0;
  epochID = 0;

  @action updateStakeInfo() {
    //console.log("updateStakeInfo")
    let addrList = [];
    addrList.push(...wanAddress.getAddrList.slice())
    addrList.push(...wanAddress.ledgerAddrList.slice())
    addrList.push(...wanAddress.trezorAddrList.slice())

    wand.request('staking_info', addrList, (err, val) => {
      //console.log('wand returned.', val)
      if (!err && val) {
        this.stakeInfo = val.base;
        this.stakerList = val.list;
        this.validatorList = val.stakerInfo;
        let reward = this.getYearReward(val.base.epochIDRaw);
        let rewardRateNow = reward * 100 / val.base.stakePool
        this.stakeInfo.currentRewardRate = rewardRateNow.toFixed(2) + '%'
        //console.log('rewardRate:', this.stakeInfo.currentRewardRate);
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

        //console.log('stakeInfo:', this.stakeInfo);
      }
    })
  }

  @computed get stakingList() {
    let validators = []
    for (let i = 0; i < this.stakerList.length; i++) {
      validators.push({
        myAccount: this.stakerList[i].myAccount,
        accountAddress: this.stakerList[i].accountAddress,
        accountPath: this.stakerList[i].accountPath,
        balance: this.stakerList[i].balance,
        myStake: this.stakerList[i].myStake,
        arrow1: arrow,
        validator: { img: validatorImg, name: this.stakerList[i].validator.name, address: this.stakerList[i].validatorAddress },
        arrow2: arrow,
        distributeRewards: this.stakerList[i].distributeRewards,
        modifyStake: ["+", "-"],
        key: i,
      })
    }
    return validators;
  }

  @computed get onlineValidatorList() {
    let validators = []
    for (let i = 0; i < this.validatorList.length; i++) {
      if (this.validatorList[i].feeRate == 10000) {
        continue;
      }

      validators.push({
        name: this.validatorList[i].name ? this.validatorList[i].name : this.validatorList[i].address,
        address: this.validatorList[i].address,
        icon: this.validatorList[i].icon? this.validatorList[i].icon : validatorImg,
        key: this.validatorList[i],
      })
    }
    return validators;
  }

  getYearReward(epochID) {
    if (global.firstEpochId == undefined) {
      global.firstEpochId = 6496392;
    }

    if (epochID < global.firstEpochId) {
      return 0;
    }

    let epochIdOffset = epochID - global.firstEpochId
    var epochTime = 1440 * 12 * 10; // slotCount * slotTime
    var epochCountInYear = (365 * 24 * 3600) / epochTime
    var redutionTimes = Math.floor(epochIdOffset / epochCountInYear)
    var reduceRate = 0.88

    reduceRate = Math.pow(reduceRate, redutionTimes)
    var yearReward = reduceRate * 2.5e6
    return yearReward
  }
}

const self = new Staking();
export default self;
