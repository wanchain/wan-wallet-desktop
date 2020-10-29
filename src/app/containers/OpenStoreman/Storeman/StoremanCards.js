import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import { formatNum } from 'utils/support';
import Card from 'components/Staking/Cards/Card';
import style from 'components/Staking/Cards/index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  storemanCards: stores.openstoreman.storemanCards
}))

@observer
class StoremanCards extends Component {
  render () {
    const { storemanCards } = this.props;
    // let stakeBottom = intl.get('staking.inValidators1') + storemanCards.myStake[1] + intl.get('staking.inValidators2');
    // let delegationBottom = intl.get('staking.inValidators1') + storemanCards.delegationStake[1] + intl.get('staking.delegations');

    // if (this.props.language === 'en_US') {
    //   if (storemanCards.myStake[1] > 1) {
    //     stakeBottom += 's';
    //   }
    //   if (storemanCards.delegationStake[1] > 1) {
    //     delegationBottom += 's';
    //   }
    // }

    return (
      <div className={style.cards}>
        <Row gutter={16}>
          <Col span={6}>
            <Card className={style.card1}
              title={intl.get('ValidatorRegister.myPrincipal')}
              value={formatNum(storemanCards.myStake[0])}
              tail="WAN"
              // bottom={stakeBottom}
              infoReady={storemanCards.myStake[1]}
            />
          </Col>
          <Col span={6}>
            <Card className={style.card2}
              title={intl.get('ValidatorRegister.myEntrusted')}
              value={formatNum(storemanCards.delegationStake[0])}
              tail="WAN"
              // bottom={delegationBottom}
              infoReady={storemanCards.delegationStake[1]}
            />
          </Col>
          <Col span={6}>
            <Card className={style.card3}
              title={intl.get('staking.totalReward')}
              value={formatNum(storemanCards.reward[0])}
              tail="WAN"
              // bottom={intl.get('staking.startFrom1') + storemanCards.reward[1] + intl.get('staking.startFrom2')}
              infoReady={storemanCards.reward[1]}
            />
          </Col>
          <Col span={6}>
            <Card
              className={style.card4}
              title={intl.get('staking.rewardRate')}
              value={storemanCards.avgReward[0]}
              infoReady={storemanCards.avgReward[1]}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default StoremanCards;
