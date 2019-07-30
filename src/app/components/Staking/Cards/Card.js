import React from 'react';
import { Row, Col } from 'antd';

import './index.less';
import mountain from 'static/image/mountain.png';

function Card(props) {
  return (
    <div className={props.className}>
      <Row>
        <Col className="card-title">
          <img className="card-ico" src={mountain} /><span>{props.title}</span>
        </Col>
      </Row>
      <Row>
        <Col className="card-value-boarder">
          <span className="card-value">{props.value}</span>
          <span className="card-tail">{props.tail}</span>
        </Col>
      </Row>
      <Row>
        <Col className="card-bottom">
          {props.bottom}
        </Col>
      </Row>
    </div>
  )
}

export default Card;