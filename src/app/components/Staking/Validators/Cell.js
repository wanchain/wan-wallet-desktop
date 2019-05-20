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
          <Col>
            This is title.
          </Col>
        </Row>
        <Row>
          <Col>
            This is bottom.
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cell