import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import './index.less';
import Card from './Card'

@inject(stores => ({
  language: stores.languageIntl.language,
  stakeInfo: stores.staking.stakeInfo,
}))

@observer
class ValidatorCards extends Component {
  render() {
    const { stakeInfo } = this.props;

    return (
      <div className="cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="card1"
              title={intl.get('staking.myStake')}
              value={stakeInfo.myStake}
              tail="WAN"
              bottom={intl.get('staking.inValidators1') + stakeInfo.validatorCnt + intl.get('staking.inValidators2')}
            />
          </Col>
          <Col span={6}>
            <Card className="card2"
              title={intl.get('staking.totalReward')}
              value={stakeInfo.totalDistributedRewards}
              tail="WAN"
              bottom={intl.get('staking.startFrom1') + stakeInfo.startFrom + intl.get('staking.startFrom2')}
            />

          </Col>
          <Col span={6}>
            <Card className="card3"
              title={intl.get('staking.rewardRate')}
              value={stakeInfo.currentRewardRate}
              tail={stakeInfo.currentRewardRateChange}
              bottom={stakeInfo.epochID}
            />
          </Col>
          <Col span={6}>
            <Card className="card4"
              title={intl.get('staking.pending')}
              value={stakeInfo.pendingWithdrawal}
              tail="WAN"
              bottom={stakeInfo.epochID}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default ValidatorCards