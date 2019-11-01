import React from 'react';
import { Row, Col } from 'antd';
import style from './index.less';
import mountain from 'static/image/mountain.png';

function Card (props) {
  return (
    <div className={props.className}>
      <Row>
        <Col className={style['card-title']}>
          <img className={style['card-ico']} src={mountain} /><span>{props.title}</span>
        </Col>
      </Row>
      <Row>
        <Col className={style['card-value-boarder']}>
          <span className={style['card-value']}>{props.value}</span>
          <span className={style['card-tail']}>{props.tail}</span>
        </Col>
      </Row>
      <Row>
        <Col className={style['card-bottom']}>
          {props.bottom}
        </Col>
      </Row>
    </div>
  )
}

export default Card;
