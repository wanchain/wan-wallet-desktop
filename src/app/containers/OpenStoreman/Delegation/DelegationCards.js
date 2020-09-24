import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import { formatNum } from 'utils/support';
import Card from 'components/Staking/Cards/Card';
import style from 'components/Staking/Cards/index.less';

@inject(stores => ({
  language: stores.languageIntl.language,
  delegationCards: stores.openstoreman.delegationCards,
}))

@observer
class DelegationCards extends Component {
  render () {
    const { language, delegationCards } = this.props;
    // let stakeBottom = intl.get('staking.inValidators1') + delegationCards.myStake[1] + intl.get('staking.inValidators2');
    // let infoReady = true;
    // if (language === 'en_US' && delegationCards.myStake[1] > 1) {
    //   stakeBottom += 's';
    // }

    return (
      <div className={style.cards}>
        <Row gutter={16}>
          <Col span={8}>
            <Card infoReady={delegationCards.myStake[2]}
              className={style.card1}
              title={intl.get('staking.myStake')}
              value={formatNum(delegationCards.myStake[0])}
              tail="WAN"
              // bottom={stakeBottom}
            />
          </Col>
          <Col span={8}>
            <Card infoReady={delegationCards.myReward[2]}
              className={style.card2}
              title={intl.get('staking.totalReward')}
              value={formatNum(delegationCards.myReward[0])}
              tail="WAN"
              // bottom={intl.get('staking.startFrom1') + delegationCards.myReward[1] + intl.get('staking.startFrom2')}
            />
          </Col>
          <Col span={8}>
            <Card infoReady={delegationCards.withdrawableAmount[1]}
              className={style.card3}
              title={intl.get('staking.unclaimAmount')}
              value={formatNum(delegationCards.withdrawableAmount[0])}
              // bottom={intl.get('staking.startFrom1') + delegationCards.myReward[1] + intl.get('staking.startFrom2')}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default DelegationCards;
