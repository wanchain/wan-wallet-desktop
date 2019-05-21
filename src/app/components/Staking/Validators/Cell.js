import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';

class Cell extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: props.title,
      bottom: props.bottom,
    }
  }

  render() {
    return (
      <div className="cell">
        <Row>
          <Col className="cell-title">
            This is title.
          </Col>
        </Row>
        <Row>
          <Col className="cell-bottom">
            This is bottom.
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cell