import React, { Component } from 'react';
import { Row,Col } from "antd";

import './index.less';

class MHeader extends Component {
  state = {
    page: 'wallet'
  }
  render () {
    return (
      <div className="header">
        <Row className="header-top">
            <Col span={6} className="title">
              <span>Wallet Detail</span>
            </Col>
            <Col span={18} className="user">
              <span>Log Out</span>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;