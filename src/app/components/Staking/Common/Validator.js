import React, { Component } from 'react';
import { Row, Col, Avatar } from 'antd';
import style from './index.less';

class Validator extends Component {
  render () {
    return (
      <div className={style.validator}>
        <Row>
          <Col>
            <div name={this.props.name} title={this.props.title}><Avatar className={style.avatarSty} src={this.props.img} size="large" />{this.props.name}</div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Validator;
