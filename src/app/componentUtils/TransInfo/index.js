import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';
import { Modal, Button, Col, Row, Input, message, Icon, Tooltip } from 'antd';
import { MAIN, TESTNET, ETHMAIN, ETHTESTNET, BTCMAIN, BTCTESTNET } from 'utils/settings';

import style from './index.less';

const COLLEFT = 5;
const COLRIGHT = 19;

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
}))

@observer
class TransInfo extends Component {
  openInBrowser = (hash, chain) => {
    if (hash === '') {
      message.warn('No txHash');
      return false;
    }
    let href = '';
    switch (chain) {
      case 'WAN':
        href = this.props.chainId === 1 ? `${MAIN}/tx/${hash}` : `${TESTNET}/tx/${hash}`;
        break;
      case 'ETH':
        href = this.props.chainId === 1 ? `${ETHMAIN}/tx/${hash}` : `${ETHTESTNET}/tx/${hash}`;
        break;
      case 'BTC':
        href = this.props.chainId === 1 ? `${BTCMAIN}/tx/${hash}` : `${BTCTESTNET}/tx/${hash}`;
        break;
      default:
        href = this.props.chainId === 1 ? `${MAIN}/tx/${hash}` : `${TESTNET}/tx/${hash}`;
    }
    wand.shell.openExternal(href);
  }

  copy2Clipboard = hashX => {
    wand.writeText(hashX);
    message.success(intl.get('CopyAndQrcode.copySuccessfully'));
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
            <Col span={COLRIGHT}>
              <Input disabled={true} placeholder={hashX} />
              <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(hashX, e)} /></Tooltip>
            </Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Chain')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={['TOKEN', 'EOS', 'WAN', 'ETH'].includes(tokenStand) ? srcChainType : srcChainAddr} /></Col>
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
            tokenStand === 'TOKEN' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.ApproveTxHash')}</Col>
              <Col span={COLRIGHT}>
                <Input disabled={true} placeholder={approveTxHash} />
                <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(approveTxHash, e)} /></Tooltip>
              </Col>
            </Row>
          }
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.LockTxHash')}</Col>
            <Col span={COLRIGHT}>
              <div className={style.checkInfoInBrowser} onClick={(e) => this.openInBrowser(lockTxHash, srcChainType)}>{lockTxHash}</div>
              <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon className={style.lock_copyIcon} type="copy" onClick={e => this.copy2Clipboard(lockTxHash, e)} /></Tooltip>
            </Col>
          </Row>
          {
            srcChainAddr === 'BTC' && noticeTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.NoticeTxHash')}</Col>
              <Col span={COLRIGHT}>
                <Input disabled={true} placeholder={noticeTxHash} />
                <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(noticeTxHash, e)} /></Tooltip>
              </Col>
            </Row>
          }
          {
            redeemTxHash !== 'NULL' && redeemTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.ConfirmTxHash')}</Col>
              <Col span={COLRIGHT}>
                <Input disabled={true} placeholder={redeemTxHash} />
                <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(redeemTxHash, e)} /></Tooltip>
              </Col>
            </Row>
          }
          {
            revokeTxHash !== 'NULL' && revokeTxHash !== '0x' &&
            <Row className={style.tableRow}>
              <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.CancelTxHash')}</Col>
              <Col span={COLRIGHT}>
                <Input disabled={true} placeholder={revokeTxHash} />
                <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(revokeTxHash, e)} /></Tooltip>
              </Col>
            </Row>
          }
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('Common.storeman')}</Col>
            <Col span={COLRIGHT}>
              <Input disabled={true} placeholder={storeman} />
              <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(storeman, e)} /></Tooltip>
            </Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Value')}</Col>
            <Col span={COLRIGHT}><Input disabled={true} placeholder={value} /></Col>
          </Row>
          <Row className={style.tableRow}>
            <Col span={COLLEFT} className={style.colLeft}>{intl.get('CrossChainTransForm.Secret')}</Col>
            <Col span={COLRIGHT}>
              <Input disabled={true} placeholder={secret} />
              <Tooltip placement="bottom" title={intl.get('Common.copy')}><Icon type="copy" onClick={e => this.copy2Clipboard(secret, e)} /></Tooltip>
            </Col>
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
