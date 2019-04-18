import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';

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
              <em className = "comLine"></em><span>Wallet Detail</span>
            </Col>
            <Col span={18} className="user">
              <Button type="primary">Log Out</Button>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;
