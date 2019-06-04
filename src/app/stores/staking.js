import { observable, action, computed, runInAction } from 'mobx';
import axios from 'axios';

import wanAddress from './wanAddress';

import validatorImg from 'static/image/validator.png';
import arrow from 'static/image/arrow.png';
import pu from 'promisefy-util';
import { getNameAndIcon } from 'utils/helper';


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

  @action async updateStakeInfo() {
    console.log("updateStakeInfo")
    let addrList = [];
    addrList.push(...wanAddress.getAddrList.slice())
    addrList.push(...wanAddress.ledgerAddrList.slice())
    addrList.push(...wanAddress.trezorAddrList.slice())

    try {
      let val = await pu.promisefy(wand.request, ['staking_info', addrList], this);
      if (val) {
        this.stakeInfo = val.base;
        this.stakerList = val.list;
        this.validatorList = val.stakerInfo;
        let reward = await this.getYearReward(val.base.epochIDRaw);
        let rewardRateNow = reward * 100 / val.base.stakePool
        this.stakeInfo.currentRewardRate = rewardRateNow.toFixed(2) + '%'
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

        if (this.validatorList && this.validatorList.length > 0) {
          for (let i = 0; i < this.validatorList.length; i++) {
            let ret = await getNameAndIcon(this.validatorList[i].address);
            console.log('getNameAndIcon', ret);
            if (ret && ret.length > 0) {
              this.validatorList[i].name = ret[0].name;
              this.validatorList[i].iconData = 'data:image/' + ret[0].iconType + ';base64,' + ret[0].iconData;
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }

    console.log('updateStakeInfo finish');


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
        validator: { img: this.stakerList[i].validator.img ? this.stakerList[i].validator.img : validatorImg, name: this.stakerList[i].validator.name, address: this.stakerList[i].validatorAddress },
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

      let capacity = 0;
      capacity += this.validatorList[i].amount;
      if(this.validatorList[i].partners.length > 0) {
        for (let m = 0; m < this.validatorList[i].partners.length; m++) {
          const partner = this.validatorList[i].partners[m];
          capacity += partner.amount;
        }
      }

      capacity *= 5;

      console.log('validator', this.validatorList[i], 'capacity', capacity);

      validators.push({
        name: this.validatorList[i].name ? this.validatorList[i].name : this.validatorList[i].address,
        address: this.validatorList[i].address,
        icon: this.validatorList[i].iconData ? this.validatorList[i].iconData : validatorImg,
        key: this.validatorList[i],
        capacity: capacity,
      })
    }
    return validators;
  }

  async getYearReward(epochID) {
    if (global.firstEpochId == undefined) {
      global.firstEpochId = await pu.promisefy(wand.request, ['staking_firstEpochId'], this)//6496392;
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
