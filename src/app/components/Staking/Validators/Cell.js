import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';

class Cell extends Component {
  render() {
    return (
      <div className="cell">
        <Row>
          <Col className="cell-title">
            <span>{this.props.title}</span><span className="cell-title-ends">{" WAN"}</span>
          </Col>
        </Row>
        <Row>
          <Col className="cell-bottom">
          {this.props.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cell