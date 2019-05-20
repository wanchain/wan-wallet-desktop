import React, { Component } from 'react';
import { Button, Table, Row, Col, message } from 'antd';
import { observer, inject } from 'mobx-react';

import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
// import StakingHistory from 'components/Staking/StakingHistory';

import './index.less';

@inject(stores => ({
  portfolioList: stores.portfolio.portfolioList,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  updateCoinPrice: () => stores.portfolio.updateCoinPrice()
}))

@observer
class Staking extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Staking');
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return (
      <div className="staking">
        <Row>
          <Col>
            <Cards/>
          </Col>
        </Row>
        <Row>
          <Col>
            <Validators/>
          </Col>
        </Row>
        <Row>
          <Col>
            {/* <StakingHistory/> */}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Staking;