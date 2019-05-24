import React, { Component } from 'react';
import { Row, Col } from 'antd';
import Card from './Card'
import './index.less';
import { observer, inject } from 'mobx-react';

@inject(stores => ({
  stakeInfo: stores.staking.stakeInfo,
}))

@observer
class Cards extends Component {
  render() {
    //console.log("Cards render", this.props.stakeInfo);
    //console.log("epoch ID", this.props.stakeInfo.epochID)

    return (
      <div className="cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="card1"
              title="My Stake"
              value={this.props.stakeInfo.myStake}
              tail="WAN"
              bottom={this.props.stakeInfo.validatorCnt}
            />
          </Col>
          <Col span={6}>
            <Card className="card2"
              title="Pending Withdrawal"
              value={this.props.stakeInfo.pendingWithdrawal}
              tail="WAN"
              bottom={this.props.stakeInfo.epochID}
            />
          </Col>
          <Col span={6}>
            <Card className="card3"
              title="Current Reward Rate"
              value={this.props.stakeInfo.currentRewardRate}
              tail={this.props.stakeInfo.currentRewardRateChange}
              bottom={this.props.stakeInfo.epochID}
            />
          </Col>
          <Col span={6}>
            <Card className="card4"
              title="Total Distributed Rewards"
              value={this.props.stakeInfo.totalDistributedRewards}
              tail="WAN"
              bottom={this.props.stakeInfo.startFrom}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cards