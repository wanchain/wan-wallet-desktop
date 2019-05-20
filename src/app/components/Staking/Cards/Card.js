import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';

class Card extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: props.title,
      value: props.value,
      tail: props.tail,
      bottom: props.bottom,
    }
  }

  render() {
    return (
      <div className="card">
        <Row>
          <Col>
            {this.state.title}
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            {this.state.value}
          </Col>
          <Col span={8} offset={2}>
            {this.state.tail}
          </Col>
        </Row>
        <Row>
          <Col>
            {this.state.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Card