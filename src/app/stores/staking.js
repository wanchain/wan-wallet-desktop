import pu from 'promisefy-util';
import Identicon from 'identicon.js';
import BigNumber from 'bignumber.js';
import intl from 'react-intl-universal';
import { observable, action, computed, toJS } from 'mobx';
import { getAddrByTypes, getInfoByAddress, checkAddrType } from 'utils/helper';
import { fromWei, dateFormat, timeFormat } from 'utils/support';

import wanAddress from './wanAddress';
import languageIntl from './languageIntl';
import arrow from 'static/image/arrow.png';

class Staking {
  @observable stakeInfo = {
    myStake: "N/A",
    validatorCnt: "N/A",
    pendingWithdrawal: "N/A",
    epochID: "Epoch N/A",
    epochEndTime: "N/A",
    currentTime: "N/A",
    currentRewardRate: "N/A %",
    currentRewardRateChange: "↑",
    totalDistributedRewards: "N/A",
    startFrom: dateFormat((new Date())/1000),
  };

  @observable stakeList = [];

  @observable validatorList = [];

  @observable validatorsInfo = {};


  rewardRate = 0;
  epochID = 0;

  @action async updateStakeInfo() {
    let addrList = [];
    addrList.push(...wanAddress.getAddrList.slice())
    addrList.push(...wanAddress.ledgerAddrList.slice())
    addrList.push(...wanAddress.trezorAddrList.slice())

    try {
      let val = await pu.promisefy(wand.request, ['staking_info', addrList]);
      if (val) {
        this.stakeInfo = val.base;
        this.stakeList = val.list;
        this.validatorList = val.stakeInfo;
        let reward = await this.getYearReward(val.base.epochIDRaw);
        let rewardRateNow = 0;
        if (val.base.stakePool !== "0") {
          rewardRateNow = reward * 100 / val.base.stakePool
        }
        this.stakeInfo.currentRewardRate = rewardRateNow.toFixed(2) + '%'
        this.stakeInfo.epochEndTime = timeFormat(val.base.epochIDRaw * (global.slotCount * global.slotTime));
        this.stakeInfo.currentTime = timeFormat(Date.now()/1000);

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
      }
    } catch (error) {
      console.log('updateStakeInfo error', error);
    }
  }

  @action getValidatorsInfo() {
    let address = self.myValidators.map(item => item.address);
    wand.request('staking_getValidatorsInfo', { address }, (err, ret) => {
      if(err) {
        console.log(err)
        return;
      }
      ret.forEach(item => {
        self.validatorsInfo[item.address] = {
          reward: fromWei(item.amount)
        }
      })
    })
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
          img: item.validator.img ? item.validator.img : ('data:image/png;base64,' + new Identicon(item.validatorAddress).toString()), 
          name: item.validator.name, 
          address: item.validatorAddress,
        },
        arrow2: arrow,
        distributeRewards: item.distributeRewards,
        modifyStake: ["+", "-"],
        quitEpoch: item.quitEpoch,
        key: index,
      })
    });
    return validators;
  }

  @computed get myValidators() {
    let newArr = [];
    let addrArr = getAddrByTypes(wanAddress.addrInfo).flat();
    addrArr.forEach(item => {
      self.validatorList.forEach(val => {
        if(val.from === item.toLowerCase()) {
          newArr.push(val);
        }
      })
    });
    return newArr;
  }

  @computed get myValidatorList() {
    let validators = [];
    self.myValidators.forEach((item, index) => {
      let addr = getInfoByAddress(item.from, ['name'], wanAddress.addrInfo);
      validators.push({
        lockTime: item.lockEpochs,
        nextLockTime: item.nextLockEpochs,
        publicKey1: item.pubSec256,
        myAddress: {addr: addr.addr, type: addr.type},
        myAccount: addr.name,
        principal: {
          value: new BigNumber(fromWei(item.amount)).plus(item.partners.reduce((prev, curr) => prev.plus(fromWei(curr.amount)), new BigNumber(0))).toString(10),
          days: 1
        },
        entrustment: {
          value: item.clients.reduce((prev, curr) => prev.plus(fromWei(curr.amount)), new BigNumber(0)).toString(10),
          person: item.clients.length,
        },
        arrow1: arrow,
        validator: { 
          img: item.iconData ? item.iconData : ('data:image/png;base64,' + new Identicon(item.address).toString()),
          name: item.name ? item.name : item.address,
          address: item.address,
        },
        arrow2: arrow,
        distributeRewards: {
          value: self.validatorsInfo[item.address] ? self.validatorsInfo[item.address].reward : 0,
        },
        modifyStake: ['topup', 'exit', 'modify'],
        key: index,
      });
    })
    return validators;
  }

  @computed get myValidatorCards() {
    let cardsList = {
      principal: ['N/A', 'N/A'],
      reward: ['N/A', 'N/A'],
      entrusted: ['N/A', 'N/A'],
      withdrawal: ['N/A', 'N/A']
    };
    cardsList.principal[0] = (self.myValidatorList.reduce((prev, curr) => prev.plus(curr.principal.value), new BigNumber(0))).toString(10);
    cardsList.principal[1] = self.myValidatorList.length;
    cardsList.reward[0] = Object.keys(self.validatorsInfo).reduce((prev, curr) => prev.plus(self.validatorsInfo[curr].reward), new BigNumber(0)).toString(10);
    cardsList.reward[1] = 0;

    cardsList.entrusted[0] = (self.myValidatorList.reduce((prev, curr) => prev.plus(curr.entrustment.value), new BigNumber(0))).toString(10);
    cardsList.entrusted[1] = (self.myValidatorList.reduce((prev, curr) => prev.plus(curr.entrustment.person), new BigNumber(0))).toString(10);
    cardsList.withdrawal[0] = self.myValidators.reduce((prev, curr) => {
      if(curr.nextLockEpochs == 0) {
        return prev.plus(new BigNumber(fromWei(curr.amount)).plus(curr.partners.reduce((pre, cur) => pre.plus(fromWei(cur.amount)), new BigNumber(0))));
      } else {
        return prev;
      }
    }, new BigNumber(0)).toString(10)
    cardsList.withdrawal[1] = 0;

    return cardsList;
  }

  @computed get onlineValidatorList() {
    let validators = []
    let minValidatorAmount = 50000;
    for (let i = 0; i < this.validatorList.length; i++) {
      if (this.validatorList[i].feeRate == 10000) {
        continue;
      }

      let quota = 0,
          totalStake = 0;
      quota += Number(fromWei(this.validatorList[i].amount));
      totalStake += quota;
      if (this.validatorList[i].partners.length > 0) {
        for (let m = 0; m < this.validatorList[i].partners.length; m++) {
          const partner = this.validatorList[i].partners[m];
          quota += Number(fromWei(partner.amount));
          totalStake += Number(fromWei(partner.amount));
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
          totalStake += Number(fromWei(client.amount));
        }
      }

      validators.push({
        name: this.validatorList[i].name ? this.validatorList[i].name : this.validatorList[i].address,
        address: this.validatorList[i].address,
        icon: this.validatorList[i].iconData ? this.validatorList[i].iconData : ('data:image/png;base64,' + new Identicon(this.validatorList[i].address).toString()),
        key: this.validatorList[i],
        quota: quota,
        feeRate: (Number(this.validatorList[i].feeRate)/100.0).toFixed(2),
        totalStake: totalStake
      })
    }
    //sort by stake amount DESC.
    validators.sort((m, n) => {
      return Number.parseInt(m.totalStake) < Number.parseInt(n.totalStake) ? 1 : -1;
    });
    return validators;
  }

  @computed get registerValidatorHistoryList() {
    let historyList = [];
    let histories = wanAddress.transHistory;
    let addrList = Object.keys(Object.assign({}, wanAddress.addrInfo.normal, wanAddress.addrInfo.ledger, wanAddress.addrInfo.trezor));
    Object.keys(wanAddress.transHistory).forEach(item => {
      if(histories[item].validator && addrList.includes(histories[item].from) && ['StakeIn', 'StakeUpdate', 'StakeAppend'].includes(histories[item].annotate)) {
        let type = checkAddrType(histories[item].from, wanAddress.addrInfo);
        let { status, annotate } = histories[item];
        let getIndex = self.stakingList.findIndex(value => value.validator.address === histories[item].validator);
        historyList.push({
          key: item,
          sendTime: histories[item].sendTime,
          time: timeFormat(histories[item].sendTime),
          from: wanAddress.addrInfo[type][histories[item].from].name,
          stakeAmount: fromWei(histories[item].value),
          annotate: languageIntl.language && ['StakeIn', 'StakeUpdate', 'StakeAppend'].includes(annotate) ? intl.get(`TransHistory.${annotate}`) : annotate,
          status: languageIntl.language && ['Failed', 'Success'].includes(status) ? intl.get(`TransHistory.${status.toLowerCase()}`) : intl.get('TransHistory.pending'),
          validator: {
            address: histories[item].validator,
            name: (getIndex === -1 || self.stakingList[getIndex].validator.name === undefined) ? histories[item].validator : self.stakingList[getIndex].validator.name,
            img: (getIndex === -1 || self.stakingList[getIndex].validator.img === undefined) ? ('data:image/png;base64,' + new Identicon(histories[item].validator).toString()) : self.stakingList[getIndex].validator.img,
          },
        });
      }
    });

    return historyList.sort((a, b) => b.sendTime - a.sendTime);      
  }

  async getYearReward(epochID) {
    if(epochID === "N/A") {
      return 0;
    }

    if (global.firstEpochId == undefined) {
      let info = await pu.promisefy(wand.request, ['staking_posInfo'])//6496392;
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
