import React, { Component } from 'react';
import { Icon, Row, Col, Button } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  pageTitle: stores.session.pageTitle,
  language: stores.languageIntl.language,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  setAuth: val => stores.session.setAuth(val),
  getMnemonic: ret => stores.session.getMnemonic(ret),
  updateAddress: (type, newAddress) => stores.wanAddress.updateAddress(type, newAddress),
}))

@observer
class MHeader extends Component {
  logOut = () => {
    wand.request('wallet_lock', null, (err, val) => {
      if (err) { 
          console.log('error printed inside callback: ', err)
          return
      }
      this.props.setAuth(false);
    })
  }

  handleDisconnect = () => {
    wand.request('wallet_deleteLedger');
    this.props.updateAddress(this.props.pageTitle.toLowerCase())
  }

  render () {
    const { pageTitle, ledgerAddrList, trezorAddrList } = this.props;

    return (
      <div className="header">
        <Row className="header-top">
            <Col span={22} className="title">
              <em className = "comLine"></em><span>{ pageTitle }</span>
              { ['Ledger', 'Trzeor'].includes(pageTitle) && ((ledgerAddrList.length !== 0) || (trezorAddrList.length !== 0))
                  ? <Button className="creatBtnHead" type="primary" shape="round" size="large" onClick={this.handleDisconnect}><Icon type="usb" theme="filled" />{intl.get('MHeader.disconnect')}</Button>
                  : ''
              }
            </Col>
            <Col span={2} className="user">
              <div className="log">
                <Icon className="logOutIco" type="poweroff" />
                <span onClick={this.logOut} className="logOut">{intl.get('MHeader.logout')}</span>
              </div>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;
