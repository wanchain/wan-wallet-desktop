import React, { Component } from 'react';
import { Row, Col } from 'antd';
import Card from './Card'
import './index.less';

class Cards extends Component {
  render() {
    return (
      <div className="cards">
        <Row gutter={16}>
          <Col span={6}>
            <Card className="card1"
              title="My Stake"
              value="150,000"
              tail="WAN"
              bottom="In 4 validators"
            />
          </Col>
          <Col span={6}>
            <Card className="card2"
              title="Pending Withdrawal"
              value="2,000"
              tail="WAN"
              bottom="Epoch 1000"
            />
          </Col>
          <Col span={6}>
            <Card className="card3"
              title="Current Return Rate"
              value="15%"
              tail="↑"
              bottom="Epoch 1000"
            />
          </Col>
          <Col span={6}>
            <Card className="card4"
              title="Total distributed rewards"
              value="15,000"
              tail="WAN"
              bottom="From 1th Jan"
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cards