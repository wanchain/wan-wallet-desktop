import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import Card from './Card';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  stakeInfo: stores.staking.stakeInfo,
}))

@observer
class Cards extends Component {
  render () {
    const { stakeInfo, language } = this.props;
    let stakeBottom = intl.get('staking.inValidators1') + stakeInfo.validatorCnt + intl.get('staking.inValidators2');
    let infoReady = stakeInfo.epochIDRaw !== undefined;
    if (language === 'en_US' && stakeInfo.validatorCnt > 1) {
      stakeBottom += 's';
    }

    return (
      <div className={style.cards}>
        <Row gutter={16}>
          <Col span={6}>
            <Card infoReady={infoReady} className={style.card1} title={intl.get('staking.myStake')} value={formatNum(stakeInfo.myStake)} tail="WAN" bottom={stakeBottom} />
          </Col>
          <Col span={6}>
            <Card infoReady={infoReady} className={style.card2} title={intl.get('staking.totalReward')} value={formatNum(stakeInfo.totalDistributedRewards)} tail="WAN" bottom={intl.get('staking.startFrom1') + stakeInfo.startFrom + intl.get('staking.startFrom2')} />
          </Col>
          <Col span={6}>
            <Card infoReady={infoReady} className={style.card3} title={intl.get('staking.rewardRate')} value={stakeInfo.currentRewardRate} bottom={stakeInfo.epochEndTime} />
          </Col>
          <Col span={6}>
            <Card infoReady={infoReady} className={style.card4} title={intl.get('staking.pending')} value={formatNum(stakeInfo.pendingWithdrawal)} tail="WAN" bottom={stakeInfo.currentTime} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cards;
