import React from 'react';
import intl from 'react-intl-universal';
import { Modal, Button, Col, Row } from 'antd';

import style from './index.less';

const COLLEFT = 5;
const COLRIGHT = 19;

function TransInfo (props) {
  const { hashX, srcChainAddr, from, to, lockTxHash, redeemTxHash, storeman, value, secret, status, time, noticeTxHash, tokenStand, approveTxHash, revokeTxHash, srcChainType } = props.record
  return (
    <Modal
      className={style.transModal}
      visible
      destroyOnClose={true}
      closable={false}
      title={intl.get('CrossChainTransForm.transInfo')}
      onCancel={props.handleCancel}
      footer={[
        <Button key="submit" type="primary" className="confirm-button" onClick={props.handleCancel}>{intl.get('Common.ok')}</Button>,
      ]}
    >
      <div className={style.transInfoMain}>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.HashX')}</Col>
          <Col span={COLRIGHT}>{hashX}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Chain')}</Col>
          <Col span={COLRIGHT}>{tokenStand === 'E20' ? srcChainType : srcChainAddr}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('Common.from')}</Col>
          <Col span={COLRIGHT}>{from}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.To')}</Col>
          <Col span={COLRIGHT}>{to}</Col>
        </Row>
        {
          tokenStand === 'E20' &&
          <Row className={style.tableRow}>
            <Col span={COLLEFT}>{intl.get('CrossChainTransForm.ApproveTxHash')}</Col>
            <Col span={COLRIGHT}>{approveTxHash}</Col>
          </Row>
        }
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.LockTxHash')}</Col>
          <Col span={COLRIGHT}>{lockTxHash}</Col>
        </Row>
        {
          srcChainAddr === 'BTC' && noticeTxHash !== '0x' &&
          <Row className={style.tableRow}>
            <Col span={COLLEFT}>{intl.get('CrossChainTransForm.NoticeTxHash')}</Col>
            <Col span={COLRIGHT}>{noticeTxHash}</Col>
          </Row>
        }
        {
          redeemTxHash !== 'NULL' && redeemTxHash !== '0x' &&
          <Row className={style.tableRow}>
            <Col span={COLLEFT}>{intl.get('CrossChainTransForm.ConfirmTxHash')}</Col>
            <Col span={COLRIGHT}>{redeemTxHash}</Col>
          </Row>
        }
        {
          revokeTxHash !== 'NULL' && revokeTxHash !== '0x' &&
          <Row className={style.tableRow}>
            <Col span={COLLEFT}>{intl.get('CrossChainTransForm.CancelTxHash')}</Col>
            <Col span={COLRIGHT}>{revokeTxHash}</Col>
          </Row>
        }
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Storeman')}</Col>
          <Col span={COLRIGHT}>{storeman}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Value')}</Col>
          <Col span={COLRIGHT}>{value}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Secret')}</Col>
          <Col span={COLRIGHT}>{secret}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Status')}</Col>
          <Col span={COLRIGHT}>{status}</Col>
        </Row>
        <Row className={style.tableRow}>
          <Col span={COLLEFT}>{intl.get('CrossChainTransForm.Date')}</Col>
          <Col span={COLRIGHT}>{time}</Col>
        </Row>
      </div>
    </Modal>
  );
}

export default TransInfo;
