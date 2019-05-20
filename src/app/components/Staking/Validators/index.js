import React, { Component } from 'react';
import { Row, Col, Button } from 'antd';
import './index.less';
import Validator from './Validator';

class Validators extends Component {
  render() {
    return (
      <div className="validators">
        <Row>
          <Col span={4} offset={24}><Button>New Validator</Button></Col>
        </Row>
        <Row>
          Validators Title
        </Row>
        <Row>
          <Validator/>
          <Validator/>
          <Validator/>
          <Validator/>
        </Row>
      </div>
    );
  }
}

export default Validators