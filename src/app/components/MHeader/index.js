import React, { Component } from 'react';
import { Icon, Row, Col, Button } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

import style from './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  language: stores.languageIntl.language,
  pageTitle: stores.languageIntl.pageTitle,
  ledgerAddrList: stores.wanAddress.ledgerAddrList,
  ledgerAddrListEth: stores.ethAddress.ledgerAddrList,
  trezorAddrList: stores.wanAddress.trezorAddrList,
  setAuth: val => stores.session.setAuth(val),
  getMnemonic: ret => stores.session.getMnemonic(ret),
  setIsFirstLogin: val => stores.session.setIsFirstLogin(val),
  updateAddress: (type, newAddress) => {
    stores.wanAddress.updateAddress(type, newAddress);
    stores.ethAddress.updateAddress(type, newAddress);
  }
}))

@observer
class MHeader extends Component {
  logOut = () => {
    // wand.request('wallet_lock', null, (err, val) => {
    //   if (err) {
    //       console.log('error printed inside callback: ', err)
    //       return
    //   }
    //   this.props.setAuth(false);
    // })
    this.props.setAuth(false);
  }

  handleDisconnect = () => {
    if (this.props.pageTitle === 'Ledger') {
      wand.request('wallet_deleteLedger');
    }
    this.props.updateAddress(this.props.pageTitle.toLowerCase())
  }

  render () {
    const { pageTitle, ledgerAddrList, ledgerAddrListEth, trezorAddrList } = this.props;
    let addrList = ledgerAddrList.concat(ledgerAddrListEth);

    return (
      <div className={style.header}>
        <Row className={style['header-top']}>
            <Col span={12} className="title">
              <em className = {style.comLine}></em><span>{ pageTitle }</span>
              { (pageTitle === 'Ledger' && addrList.length !== 0) || (pageTitle === 'Trezor' && trezorAddrList.length !== 0)
                  ? <Button className={style.createBtnHead} type="primary" shape="round" size="large" onClick={this.handleDisconnect}><Icon type="usb" theme="filled" />{intl.get('MHeader.disconnect')}</Button>
                  : ''
              }
            </Col>
            <Col span={12} className={style.user}>
              <div className="log">
                <Icon className={style.logOutIco} type="poweroff" />
                <span onClick={this.logOut} className={style.logOut}>{intl.get('MHeader.logout')}</span>
              </div>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;
