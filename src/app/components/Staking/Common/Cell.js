import React, { Component } from 'react';
import { Row, Col } from 'antd';
import style from './index.less';

class Cell extends Component {
  render () {
    return (
      <div className={style.cell}>
        <Row>
          <Col className={style['cell-title']}>
            <span>{this.props.title}</span><span className={style['cell-title-ends']}>{' WAN'}</span>
          </Col>
        </Row>
        <Row>
          <Col className={style['cell-bottom']}>
          {this.props.bottom}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cell;
