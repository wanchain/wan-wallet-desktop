import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from 'components/Staking/Cards/index.less';
import Card from 'components/Staking/Cards/Card';
import { timeFormat } from 'utils/support';

@inject(stores => ({
  stakeInfo: stores.staking.stakeInfo,
  language: stores.languageIntl.language,
  myValidatorCards: stores.staking.myValidatorCards,
}))

@observer
class ValidatorCards extends Component {
  render () {
    const { myValidatorCards } = this.props;
    let stakeBottom = intl.get('staking.inValidators1') + myValidatorCards.principal[1] + intl.get('staking.inValidators2');
    let delegationBottom = intl.get('staking.inValidators1') + myValidatorCards.entrusted[1] + intl.get('staking.delegations');

    if (this.props.language === 'en_US') {
      if (myValidatorCards.principal[1] > 1) {
        stakeBottom += 's';
      }
      if (myValidatorCards.entrusted[1] > 1) {
        delegationBottom += 's';
      }
    }

    return (
      <div className={style.cards}>
        <Row gutter={16}>
          <Col span={8}>
            <Card className={style.card1}
              title={intl.get('ValidatorRegister.myPrincipal')}
              value={myValidatorCards.principal[0]}
              tail="WAN"
              bottom={stakeBottom}
              infoReady={myValidatorCards.infoReady}
            />
          </Col>
          <Col span={8}>
            <Card className={style.card2}
              title={intl.get('ValidatorRegister.myEntrusted')}
              value={myValidatorCards.entrusted[0]}
              tail="WAN"
              bottom={delegationBottom}
              infoReady={myValidatorCards.infoReady}
            />

          </Col>
          <Col span={8}>
            <Card className={style.card3}
              title={intl.get('staking.totalReward')}
              value={myValidatorCards.reward[0]}
              tail="WAN"
              bottom={intl.get('staking.startFrom1') + myValidatorCards.reward[1] + intl.get('staking.startFrom2')}
              infoReady={myValidatorCards.infoReady}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default ValidatorCards;
