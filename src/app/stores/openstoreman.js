import Identicon from 'identicon.js';
import intl from 'react-intl-universal';
import { BigNumber } from 'bignumber.js';
import { observable, action, computed, runInAction, toJS } from 'mobx';

import wanAddress from './wanAddress';
import { getInfoByAddress, checkAddrType, getValueByAddrInfo } from 'utils/helper';
import { formatLongText, fromWei, timeFormat, formatNum, showNA, wandWrapper } from 'utils/support';
import { OSMSTAKEACT, WANPATH, OSMDELEGATIONACT, storemanGroupStatus, WALLETID } from 'utils/settings'

class OpenStoreman {
  @observable storemanGroupList = [];

  @observable storemanListInfo = [];

  @observable storemanDelegatorInfo =[];

  @observable storemanMemberList = [];

  @observable storemanConf = {};

  @observable storemanStakeTotalIncentive = [];

  @observable storemanDelegatorTotalIncentive = [];

  @observable storemanListInfoInfoReady = false;

  @observable storemanDelegatorInfoInfoReady = false;

  @observable storemanStakeTotalIncentiveInfoReady = false;

  @observable storemanDelegatorTotalIncentiveInfoReady = false;

  @computed get groupListData () {
    let data = [];
    this.storemanGroupList.filter(v => v.canStakeIn).forEach((item, index) => {
      data.push({
        key: index,
        minStakeIn: fromWei(item.minStakeIn),
        groupId: formatLongText(item.groupId),
        groupIdText: item.groupId,
        startTime: timeFormat(item.registerTime),
        endTime: timeFormat(item.endRegisterTime),
        crosschain: `${item.chain1[2]} / ${item.chain2[2]}`,
        currDeposit: showNA(fromWei(item.deposit)),
        delegationFee: item.delegateFee / 10000 + '%',
        action: 'Register',
      })
    });
    return data;
  }

  @computed get storemanListData () {
    let data = [];
    this.storemanListInfo.forEach((item, index) => {
      let accountInfo = getInfoByAddress(item.from, ['name', 'path'], wanAddress.addrInfo);
      let groupInfo = this.storemanGroupList.find(v => v.groupId === item.groupId);
      if (accountInfo && groupInfo && accountInfo.type) {
        accountInfo.path = accountInfo.type !== 'normal' ? getValueByAddrInfo(accountInfo.addr, 'path', wanAddress.addrInfo) : `${WANPATH}${accountInfo.path}`;
        accountInfo.walletID = accountInfo.type !== 'normal' ? WALLETID[accountInfo.type.toUpperCase()] : WALLETID.NATIVE;
        data.push({
          key: index,
          account: accountInfo.name,
          myAddress: accountInfo,
          stake: fromWei(item.deposit),
          groupId: item.groupId,
          rank: [item.rank, item.selectedCount],
          slash: item.slashedCount,
          activity: item.activity,
          reward: fromWei(item.incentive || 0), // TODO to delete the '|| 0'
          crosschain: `${groupInfo.chain1[2]} / ${groupInfo.chain2[2]}`,
          status: storemanGroupStatus[groupInfo.status],
          wkAddr: item.wkAddr,
          canStakeOut: item.canStakeOut,
          canStakeClaim: item.canStakeClaim,
          minStakeIn: fromWei(groupInfo.minStakeIn)
        })
      }
    });
    return data;
  }

  @computed get delegatorListData () {
    let data = [];
    this.storemanDelegatorInfo.forEach((item, index) => {
      let accountInfo = getInfoByAddress(item.from, ['name', 'path'], wanAddress.addrInfo);
      if (accountInfo && accountInfo.type) {
        accountInfo.path = accountInfo.type !== 'normal' ? getValueByAddrInfo(accountInfo.addr, 'path', wanAddress.addrInfo) : `${WANPATH}${accountInfo.path}`;
        accountInfo.walletID = accountInfo.type !== 'normal' ? WALLETID[accountInfo.type.toUpperCase()] : WALLETID.NATIVE;
        data.push({
          key: index,
          account: accountInfo.name,
          myAddress: accountInfo,
          stake: fromWei(item.deposit),
          groupId: item.groupId,
          reward: fromWei(item.incentive),
          storeman: item.wkAddr,
          crosschain: `${item.chain1[2]} / ${item.chain2[2]}`,
          wkAddr: item.wkAddr,
          quited: item.quited,
          canDelegateOut: item.canDelegateOut,
          deposit: item.wkStake.deposit,
          delegateDeposit: item.wkStake.delegateDeposit
        })
      }
    });
    return data;
  }

  @computed get storemanHistoryList () {
    let historyList = [];
    let histories = wanAddress.transHistory;
    let addrList = Object.keys(Object.assign({}, wanAddress.addrInfo.normal, wanAddress.addrInfo.ledger, wanAddress.addrInfo.trezor));
    Object.keys(wanAddress.transHistory).forEach(item => {
      if (addrList.includes(histories[item].from) && OSMSTAKEACT.includes(histories[item].annotate)) {
        let type = checkAddrType(histories[item].from, wanAddress.addrInfo);
        let { status, annotate } = histories[item];
        historyList.push({
          key: item,
          storeman: histories[item].wkAddr,
          sendTime: histories[item].sendTime,
          time: timeFormat(histories[item].sendTime),
          from: wanAddress.addrInfo[type][histories[item].from].name,
          fromAddress: histories[item].from,
          stakeAmount: formatNum(fromWei(histories[item].value)),
          annotate,
          status,
        });
      }
    });

    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get delegationHistoryList () {
    let historyList = [];
    let histories = wanAddress.transHistory;
    let addrList = Object.keys(Object.assign({}, wanAddress.addrInfo.normal, wanAddress.addrInfo.ledger, wanAddress.addrInfo.trezor));
    Object.keys(wanAddress.transHistory).forEach(item => {
      if (addrList.includes(histories[item].from) && OSMDELEGATIONACT.includes(histories[item].annotate)) {
        let type = checkAddrType(histories[item].from, wanAddress.addrInfo);
        let { status, annotate } = histories[item];
        historyList.push({
          key: item,
          storeman: histories[item].wkAddr,
          sendTime: histories[item].sendTime,
          time: timeFormat(histories[item].sendTime),
          from: wanAddress.addrInfo[type][histories[item].from].name,
          fromAddress: histories[item].from,
          stakeAmount: formatNum(fromWei(histories[item].value)),
          annotate,
          status,
        });
      }
    });

    return historyList.sort((a, b) => b.sendTime - a.sendTime);
  }

  @computed get groupChainInfo () {
    return [...new Set(this.storemanGroupList.map(v => `${v.chain1[2]} / ${v.chain2[2]}`))];
  }

  @computed get storemanCards () {
    let cardsList = {
      myStake: ['N/A', 'N/A', false],
      delegationStake: ['N/A', 'N/A', false],
      reward: ['N/A', 'N/A', false],
    };

    cardsList.myStake[0] = fromWei(this.storemanListInfo.reduce((prev, curr) => new BigNumber(prev).plus(curr.deposit).toString(10), 0));
    cardsList.myStake[1] = this.storemanListInfo.length;
    cardsList.myStake[2] = this.storemanListInfoInfoReady;
    cardsList.delegationStake[0] = fromWei(this.storemanListInfo.reduce((prev, curr) => new BigNumber(prev).plus(curr.delegateDeposit).toString(10), 0));
    cardsList.delegationStake[1] = this.storemanListInfo.reduce((prev, curr) => new BigNumber(prev).plus(curr.delegatorCount).toString(10), 0);
    cardsList.delegationStake[2] = this.storemanListInfoInfoReady;
    cardsList.reward[0] = fromWei(this.storemanStakeTotalIncentive.reduce((prev, curr) => new BigNumber(prev).plus(curr.amount).toString(10), 0));
    cardsList.reward[1] = this.storemanStakeTotalIncentive.length && this.storemanStakeTotalIncentive[0] ? timeFormat(this.storemanStakeTotalIncentive[0].timestamp) : 'N/A'
    cardsList.reward[2] = this.storemanStakeTotalIncentiveInfoReady;

    return cardsList;
  }

  @computed get delegationCards () {
    let cardsList = {
      myStake: ['N/A', 'N/A'],
      myReward: ['N/A', 'N/A'],
      withdrawableAmount: ['N/A', 'N/A'],
    };

    cardsList.myStake[0] = fromWei(this.storemanDelegatorInfo.reduce((prev, curr) => new BigNumber(prev).plus(curr.deposit).toString(10), 0));
    cardsList.myStake[1] = this.storemanDelegatorInfo.length;
    cardsList.myStake[2] = this.storemanDelegatorInfoInfoReady;
    cardsList.myReward[0] = fromWei(this.storemanDelegatorTotalIncentive.reduce((prev, curr) => new BigNumber(prev).plus(curr.amount).toString(10), 0));
    cardsList.myReward[1] = this.storemanDelegatorTotalIncentive.length && this.storemanDelegatorTotalIncentive[0] ? timeFormat(this.storemanDelegatorTotalIncentive[0].timestamp) : 'N/A';
    cardsList.myReward[2] = this.storemanDelegatorTotalIncentiveInfoReady;
    cardsList.withdrawableAmount[0] = fromWei(this.storemanDelegatorInfo.reduce((prev, curr) => new BigNumber(prev).plus(curr.incentive).toString(10), 0));
    cardsList.withdrawableAmount[1] = this.storemanDelegatorInfoInfoReady;

    return cardsList;
  }

  @action async getOpenStoremanGroupList () {
    try {
      let ret = await wandWrapper('storeman_getOpenStoremanGroupList');
      runInAction(() => {
        this.storemanGroupList = ret;
      })
    } catch (err) {
      console.log(`action_getOpenStoremanGroupList: ${err}`);
    }
  }

  @action async getStoremanStakeInfo () {
    let { normal, ledger, trezor } = wanAddress.addrInfo;
    let sender = Object.keys(Object.assign({}, normal, ledger, trezor));
    try {
      let ret = await wandWrapper('storeman_getStoremanStakeInfo', { sender });
      console.log('storeman_getStoremanStakeInfo_ret', ret);
      this.storemanListInfo = ret;
      this.storemanListInfoInfoReady = true;
    } catch (err) {
      console.log(`action_getStoremanStakeInfo: ${err}`);
    }
  }

  @action async getStoremanDelegatorInfo () {
    let { normal, ledger, trezor } = wanAddress.addrInfo;
    let sender = Object.keys(Object.assign({}, normal, ledger, trezor));

    try {
      let ret = await wandWrapper('storeman_getStoremanDelegatorInfo', { sender });
      runInAction(() => {
        this.storemanDelegatorInfo = ret;
        this.storemanDelegatorInfoInfoReady = true;
      })
    } catch (err) {
      console.log(`action_getStoremanDelegatorInfo: ${err}`);
    }
  }

  @action async getStoremanMemberList () {
    Promise.all([wandWrapper('storeman_getOpenStoremanGroupList'), wandWrapper('storeman_getStoremanConf')]).then(val => {
      let [ret, ret1] = val;
      runInAction(() => {
        this.storemanGroupList = ret;
        this.storemanConf = ret1;
      })
      let groupMemberId = ret.filter(i => i.status >= 4).map(v => v.groupId);
      let groupCandidatesMemberId = ret.filter(i => i.status < 4).map(v => v.groupId);
      return Promise.all([wandWrapper('storeman_getStoremanGroupMember', { groupId: groupMemberId }), wandWrapper('storeman_getStoremanCandidates', { groupId: groupCandidatesMemberId })])
    }).then(ret => {
      runInAction(() => {
        let temp = ret.flat();
        temp.forEach(item => {
          let temp = this.storemanGroupList.find(v => v.groupId === item.groupId);
          item.chain1 = temp.chain1;
          item.chain2 = temp.chain2;
          item.nameShowing = item.name ? item.name : item.wkAddr;
          item.icon = item.iconData ? `data:image/${item.iconType};base64, ${item.iconData}` : ('data:image/png;base64,' + new Identicon(item.wkAddr).toString());
        })
        this.storemanMemberList = temp;
      })
    }).catch(err => console.log(err))
  }

  @action async getStoremanStakeTotalIncentive () {
    let { normal, ledger, trezor } = wanAddress.addrInfo;
    let sender = Object.keys(Object.assign({}, normal, ledger, trezor));
    try {
      let ret = await wandWrapper('storeman_getStoremanStakeTotalIncentive', { sender });
      ret.sort((a, b) => a - b)
      runInAction(() => {
        this.storemanStakeTotalIncentive = ret;
        this.storemanStakeTotalIncentiveInfoReady = true;
      })
    } catch (err) {
      console.log(`action_getStoremanStakeTotalIncentive: ${err}`);
    }
  }

  @action async getStoremanDelegatorTotalIncentive () {
    let { normal, ledger, trezor } = wanAddress.addrInfo;
    let sender = Object.keys(Object.assign({}, normal, ledger, trezor));
    try {
      let ret = await wandWrapper('storeman_getStoremanDelegatorTotalIncentive', { sender });
      ret.sort((a, b) => a - b)
      runInAction(() => {
        this.storemanDelegatorTotalIncentive = ret;
        this.storemanDelegatorTotalIncentiveInfoReady = true;
      })
    } catch (err) {
      console.log(`action_getStoremanDelegatorTotalIncentive: ${err}`);
    }
  }

  @action async getStoremanConf () {
    if (!Object.keys(this.storemanConf).length) {
      try {
        let ret = await wandWrapper('storeman_getStoremanConf');
        runInAction(() => {
          this.storemanConf = ret;
        })
      } catch (err) {
        console.log(`action_getStoremanConf: ${err}`);
      }
    }
  }
}

export default new OpenStoreman();
