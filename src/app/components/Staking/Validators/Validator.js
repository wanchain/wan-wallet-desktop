import React, { Component } from 'react';
import { Row, Col, Button } from 'antd';
import './index.less';
import Cell from './Cell';

class Validator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: props.account,
      stake: props.stake,
      stakeTime: props.time,
      validator: props.validator,
      rewardTime: props.reward,
    }
  }

  render() {
    return (
      <div className="validator">
        <Row>
          <Col span={3} ><Cell /></Col>
          <Col span={3} >-></Col>
          <Col span={3} ><Cell /></Col>
          <Col span={3} >-></Col>
          <Col span={3} ><Cell /></Col>
          <Col span={3} >-></Col>
          <Col span={3} ><Cell /></Col>
          <Col span={3} >
            <Button>+</Button>
            <Button>-</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator