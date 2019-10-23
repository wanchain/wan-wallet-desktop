import React from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, Col, Row } from 'antd';

import './index.less';

const COLLEFT = 5;
const COLRIGHT = 19;

function TransInfo (props) {
  const { hashX, srcChainAddr, from, to, lockTxHash, redeemTxHash, storeman, value, secret, status, time } = props.record
  return (
    <Modal
      className="transModal"
      visible
      destroyOnClose={true}
      closable={false}
      title={intl.get('CrossChainTransForm.transInfo')}
      onCancel={props.handleCancel}
      footer={[
        <Button key="submit" type="primary" className="confirm-button" onClick={props.handleCancel}>{intl.get('popup.ok')}</Button>,
      ]}
    >
      <div className="transInfoMain">
        <Row className="tableRow">
          <Col span={COLLEFT}>HashX</Col>
          <Col span={COLRIGHT}>{hashX}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Chain</Col>
          <Col span={COLRIGHT}>{srcChainAddr}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>From</Col>
          <Col span={COLRIGHT}>{from}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>To</Col>
          <Col span={COLRIGHT}>{to}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>lockTxHash</Col>
          <Col span={COLRIGHT}>{lockTxHash}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>confirmTxHash</Col>
          <Col span={COLRIGHT}>{redeemTxHash}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Storeman</Col>
          <Col span={COLRIGHT}>{storeman}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Value</Col>
          <Col span={COLRIGHT}>{value}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Secret</Col>
          <Col span={COLRIGHT}>{secret}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Status</Col>
          <Col span={COLRIGHT}>{status}</Col>
        </Row>
        <Row className="tableRow">
          <Col span={COLLEFT}>Date</Col>
          <Col span={COLRIGHT}>{time}</Col>
        </Row>
      </div>
    </Modal>
  );
}

export default TransInfo;
