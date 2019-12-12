import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Button, Col, Row, Input, message } from 'antd';
import { MAIN, TESTNET } from 'utils/settings';

import style from './index.less';

const COLLEFT = 5;
const COLRIGHT = 19;

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
}))

@observer
class TransInfo extends Component {
  openInBrowser = (hash) => {
    if (hash === '') {
      message.warn('No txHash');
      return false;
    }
    let href = this.props.chainId === 1 ? `${MAIN}/tx/${hash}` : `${TESTNET}/tx/${hash}`;
    wand.shell.openExternal(href);
  }

  render() {
    const { hashX, srcChainAddr, from, to, lockTxHash, redeemTxHash, storeman, value, secret, status, time, noticeTxHash, tokenStand, approveTxHash, revokeTxHash, srcChainType } = this.props.record;

    return (
      <Modal
        className={style.transModal}
        visible
        destroyOnClose={true}
        closable={false}
        title={intl.get('CrossChainTransForm.transInfo')}
        onCancel={this.props.handleCancel}
        footer={[
          <Button key="submit" type="primary" className="confirm-button" onClick={this.props.handleCancel}>{intl.get('Common.ok')}</Button>,
        ]}
      >
        <div className={style.transInfoMain}>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.HashX')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={hashX} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Chain')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={tokenStand === 'E20' ? srcChainType : srcChainAddr} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('Common.from')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={from} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.To')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={to} /></Col>
          </Row>
          {
            tokenStand === 'E20' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.ApproveTxHash')}</Col>
              <Col span={COLRIGHT}><Input disabled={true} placeholder={approveTxHash} /></Col>
            </Row>
          }
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.LockTxHash')}</Col>
            {/* <Col span={COLRIGHT}><Input disabled={false} placeholder={lockTxHash} className={style.checkInfoInBrowser} onClick={(e) => this.openInBrowser(lockTxHash, e)} /></Col> */}
            <Col span={COLRIGHT}><div className={style.checkInfoInBrowser} onClick={(e) => this.openInBrowser(lockTxHash)}>{lockTxHash}</div></Col>
          </Row>
          {
            srcChainAddr === 'BTC' && noticeTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.NoticeTxHash')}</Col>
              <Col span={COLRIGHT}><Input disabled={true} placeholder={noticeTxHash} /></Col>
            </Row>
          }
          {
            redeemTxHash !== 'NULL' && redeemTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.ConfirmTxHash')}</Col>
              <Col span={COLRIGHT}><Input disabled={true} placeholder={redeemTxHash} /></Col>
            </Row>
          }
          {
            revokeTxHash !== 'NULL' && revokeTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.CancelTxHash')}</Col>
              <Col span={COLRIGHT}><Input disabled={true} placeholder={revokeTxHash} /></Col>
            </Row>
          }
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Storeman')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={storeman} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Value')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={value} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Secret')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={secret} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Status')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={status} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Date')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={time} /></Col>
          </Row>
        </div>
      </Modal>
    );
  }
}

export default TransInfo;
