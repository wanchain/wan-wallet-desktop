import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Modal, Button, Col, Row, Input } from 'antd';

import style from './index.less';
import { MAIN, TESTNET } from 'utils/settings'

const centerStyle = { textAlign: 'center' };

@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
}))

@observer
class DAppInfo extends Component {
  handleJumpToWebsite = (url, prefix) => {
    if (prefix) {
      url = this.props.chainId === 1 ? `${MAIN}/address/${url}` : `${TESTNET}/address/${url}`
    }
    wand.shell.openExternal(url);
  }

  render() {
    const { info, handleClose } = this.props;

    return (
      <Modal
        className={style.transModal}
        visible
        destroyOnClose={true}
        closable={false}
        title={intl.get('DApp.DAppInfo')}
        onCancel={this.props.handleCancel}
        footer={[
          <Button key="submit" type="primary" className="confirm-button" onClick={handleClose}>{intl.get('DApp.infoClose')}</Button>,
        ]}
      >
        <div className={style.transInfoMain}>
          <Row type="flex" align="middle" justify="center">
            <Col span={8} style={centerStyle}>
              <img className={style.dappIcon} src={`data:image/${info.iconType};base64,${info.iconData}`} />
            </Col>
            <Col span={16}>
              <p>{info.name} <Button className={style.createBtnType} shape="round" size="small">{intl.get(`DApp.${info.type}`)}</Button></p>
              <div className={style.siteStyle}>
                <p>{intl.get('DApp.Website')}: <a className={style.linkStyle} onClick={() => this.handleJumpToWebsite(info.url)}>{info.url}</a></p>
                <p>{intl.get('DApp.Creator')}: <a className={style.linkStyle} onClick={() => this.handleJumpToWebsite(info.creatorWebsite)}>{info.creator} ({info.creatorWebsite})</a></p>
              </div>
              <p>{intl.get('DApp.scAddress')}</p>
              <p><a className={style.linkStyle} onClick={() => this.handleJumpToWebsite(info.scAddress[0], true)}>{info.scAddress[0]}</a></p>
            </Col>
          </Row>
          <Input.TextArea disabled autosize={{ minColumns: 15, minRows: 4, maxRows: 10 }} className={style.stepText} value={info.detail}></Input.TextArea>
        </div>
      </Modal>
    );
  }
}

export default DAppInfo;
