import React, { Component } from 'react';
import { Row, Col, Button } from 'antd';
import './index.less';
import Validator from './Validator';

class Validators extends Component {
  render() {
    return (
      <div className="validators">
        <Row>
          <Col span={4} offset={20}><Button>New Validator</Button></Col>
        </Row>
        <Row>
          <Col span={3} >Account</Col>
          <Col span={3} ></Col>
          <Col span={3} >My Stake</Col>
          <Col span={3} ></Col>
          <Col span={3} >Validator</Col>
          <Col span={3} ></Col>
          <Col span={3} >Distributed rewards</Col>
          <Col span={3} >Modify stake</Col>
        </Row>
        <Row>
          <Validator />
          <Validator />
          <Validator />
          <Validator />
          <Validator />

        </Row>
      </div>
    );
  }
}

export default Validators