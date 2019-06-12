import React, { Component } from 'react';
import { Row, Col, Avatar } from 'antd';

import './index.less';

class Validator extends Component {
  render() {
    return (
      <div className="validator">
        <Row>
          <Col>
            <div name={this.props.name} title={this.props.title}><Avatar src={this.props.img} size="large" />&nbsp;{this.props.name}</div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator