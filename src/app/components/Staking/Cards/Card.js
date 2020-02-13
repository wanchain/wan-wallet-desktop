import React from 'react';
import { Row, Col, Icon } from 'antd';
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
          {
            props.infoReady
            ? <span className={style['card-value']}>{props.value}</span>
            : <Icon type="loading" style={{ fontSize: 24 }} spin />
          }
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
