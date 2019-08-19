import { Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import './index.less';
import Card from './Card';
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
      <div className="cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="card1"
              title={intl.get('ValidatorRegister.myPrincipal')}
              value={myValidatorCards.principal[0]}
              tail="WAN"
              bottom={stakeBottom}
            />
          </Col>
          <Col span={6}>
            <Card className="card2"
              title={intl.get('ValidatorRegister.myEntrusted')}
              value={myValidatorCards.entrusted[0]}
              tail="WAN"
              bottom={delegationBottom}
            />

          </Col>
          <Col span={6}>
            <Card className="card3"
              title={intl.get('staking.totalReward')}
              value={myValidatorCards.reward[0]}
              tail="WAN"
              bottom={intl.get('staking.startFrom1') + myValidatorCards.reward[1] + intl.get('staking.startFrom2')}
            />
          </Col>
          <Col span={6}>
            <Card className="card4"
              title={intl.get('staking.pending')}
              value={myValidatorCards.withdrawal[0]}
              tail="WAN"
              bottom={timeFormat(Date.now() / 1000)}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default ValidatorCards;
