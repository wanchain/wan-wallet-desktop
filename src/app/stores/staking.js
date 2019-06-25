import pu from 'promisefy-util';
import { observable, action, computed } from 'mobx';

import wanAddress from './wanAddress';
import { getNameAndIcon } from 'utils/helper';
import { fromWei, dateFormat } from 'utils/support';
import arrow from 'static/image/arrow.png';
import validatorImg from 'static/image/validator.png';

class Staking {
  @observable stakeInfo = {
    myStake: "N/A",
    validatorCnt: "N/A",
    pendingWithdrawal: "N/A",
    epochID: "Epoch N/A",
    currentRewardRate: "N/A %",
    currentRewardRateChange: "↑",
    totalDistributedRewards: "N/A",
    startFrom: dateFormat((new Date())/1000),
  };

  @observable stakeList = [];

  @observable validatorList = [];

  rewardRate = 0;
  epochID = 0;

  @action async updateStakeInfo() {
    let addrList = [];
    addrList.push(...wanAddress.getAddrList.slice())
    addrList.push(...wanAddress.ledgerAddrList.slice())
    addrList.push(...wanAddress.trezorAddrList.slice())

    try {
      let val = await pu.promisefy(wand.request, ['staking_info', addrList], this);
      if (val) {
        this.stakeInfo = val.base;
        this.stakeList = val.list;
        this.validatorList = val.stakerInfo;
        let reward = await this.getYearReward(val.base.epochIDRaw);
        let rewardRateNow = 0;
        if (val.base.stakePool !== "0") {
          rewardRateNow = reward * 100 / val.base.stakePool
        }
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
            if (ret && ret.length > 0) {
              this.validatorList[i].name = ret[0].name;
              this.validatorList[i].iconData = 'data:image/' + ret[0].iconType + ';base64,' + ret[0].iconData;
            }
          }
        }
      }
    } catch (error) {
      console.log('updateStakeInfo error', error);
    }
  }

  @computed get stakingList() {
    let validators = []
    this.stakeList.forEach((item, index) => {
      validators.push({
        myAccount: item.myAccount,
        accountAddress: item.accountAddress,
        accountPath: item.accountPath,
        balance: item.balance,
        myStake: item.myStake,
        arrow1: arrow,
        validator: { 
          img: item.validator.img ? item.validator.img : validatorImg, 
          name: item.validator.name, 
          address: item.validatorAddress,
        },
        arrow2: arrow,
        distributeRewards: item.distributeRewards,
        modifyStake: ["+", "-"],
        key: index,
      })
    })
    return validators;
  }

  @computed get onlineValidatorList() {
    let validators = []
    let minValidatorAmount = 50000;
    for (let i = 0; i < this.validatorList.length; i++) {
      if (this.validatorList[i].feeRate == 10000) {
        continue;
      }

      let quota = 0;
      quota += Number(fromWei(this.validatorList[i].amount));
      if (this.validatorList[i].partners.length > 0) {
        for (let m = 0; m < this.validatorList[i].partners.length; m++) {
          const partner = this.validatorList[i].partners[m];
          quota += Number(fromWei(partner.amount));
        }
      }

      // Do not display the amount less than 50000.
      if (quota < minValidatorAmount) {
        continue;
      }

      quota *= 10;

      if (this.validatorList[i].clients.length > 0) {
        for (let m = 0; m < this.validatorList[i].clients.length; m++) {
          const client = this.validatorList[i].clients[m];
          quota -= Number(fromWei(client.amount));
        }
      }

      validators.push({
        name: this.validatorList[i].name ? this.validatorList[i].name : this.validatorList[i].address,
        address: this.validatorList[i].address,
        icon: this.validatorList[i].iconData ? this.validatorList[i].iconData : validatorImg,
        key: this.validatorList[i],
        quota: quota,
        feeRate: (Number(this.validatorList[i].feeRate)/100.0).toFixed(2),
      })
    }
    return validators;
  }

  async getYearReward(epochID) {
    if(epochID === "N/A") {
      return 0;
    }

    if (global.firstEpochId == undefined) {
      let info = await pu.promisefy(wand.request, ['staking_posInfo'], this)//6496392;
      global.firstEpochId = info.firstEpochId;
      global.slotCount = info.slotCount;
      global.slotTime = info.slotTime;
    }

    if (epochID < global.firstEpochId) {
      return 0;
    }

    let epochIdOffset = epochID - global.firstEpochId
    var epochTime = global.slotCount * global.slotTime; // slotCount * slotTime
    var epochCountInYear = (365 * 24 * 3600) / epochTime
    var reductionTimes = Math.floor(epochIdOffset / epochCountInYear)
    var reduceRate = 0.88

    reduceRate = Math.pow(reduceRate, reductionTimes)
    var yearReward = reduceRate * 2.5e6
    return yearReward
  }
}

const self = new Staking();
export default self;
