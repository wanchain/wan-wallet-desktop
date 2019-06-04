import React, { Component } from 'react';
import { Row, Col, Avatar } from 'antd';
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
            <div name={this.state.name}><Avatar src={this.state.img} size="large" />{" "}{this.state.name}</div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator