import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';
import mountain from 'static/image/mountain.png';

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
          <Col className="card-title">
            <img className="card-ico" src={mountain} /><span>{this.state.title}</span>
          </Col>
        </Row>
        <Row>
          <Col className="card-value-boarder">
            <span className="card-value">{this.state.value}</span>
            <span className="card-tail">{this.state.tail}</span>
          </Col>
        </Row>
        <Row>
          <Col className="card-bottom">
            {this.state.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Card