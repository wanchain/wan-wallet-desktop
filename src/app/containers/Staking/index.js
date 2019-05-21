import React, { Component } from 'react';
import { Button, Table, Row, Col, message } from 'antd';
import { observer, inject } from 'mobx-react';

import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
import StakingHistory from 'components/Staking/StakingHistory';

import totalImg from 'static/image/wan.png';

import './index.less';

@inject(stores => ({
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
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
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt="Wanchain" /><span className="dashboard">Dashboard</span></Col>
          <Col span={12} className="col-right">
            <Button className="newValidatorBtn" type="primary" shape="round" size="large">New Validator</Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <Cards />
          </Col>
        </Row>
        <Row>
          <Col>
            <Validators />
          </Col>
        </Row>
        <Row>
          <Col>
            <StakingHistory />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Staking;