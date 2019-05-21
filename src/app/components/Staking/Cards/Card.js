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
      className: props.className,
    }
  }

  render() {
    return (
      <div className={this.state.className}>
        <Row>
          <Col className="title">
            {this.state.title}
          </Col>
        </Row>
        <Row>
          <Col>
          <span className="value">{this.state.value}</span>
          <span className="tail">{this.state.tail}</span>
          </Col>
          {/* <Col span={8} className="value">
            {this.state.value}
          </Col>
          <Col span={8} offset={2} className="tail">
            {this.state.tail}
          </Col> */}
        </Row>
        <Row>
          <Col className="bottom">
            {this.state.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Card