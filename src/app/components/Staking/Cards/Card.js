import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';
import mountain from 'static/image/mountain.png';

class Card extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={this.props.className}>
        <Row>
          <Col className="card-title">
            <img className="card-ico" src={mountain} /><span>{this.props.title}</span>
          </Col>
        </Row>
        <Row>
          <Col className="card-value-boarder">
            <span className="card-value">{this.props.value}</span>
            <span className="card-tail">{this.props.tail}</span>
          </Col>
        </Row>
        <Row>
          <Col className="card-bottom">
            {this.props.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Card