import React, { Component } from 'react';
import { Row, Col } from 'antd';
import './index.less';

class Validator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      img: props.img,
      name: props.name,
    }
  }

  render() {
    return (
      <div className="validator">
        <Row>
          <Col>
            <img src={this.state.img}/><span className="name">{this.state.name}</span>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator