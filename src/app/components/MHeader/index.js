import React, { Component } from 'react';
import { Icon, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  auth: stores.session.auth,
  pageTitle: stores.session.pageTitle,
  setAuth: val => stores.session.setAuth(val),
  getMnemonic: ret => stores.session.getMnemonic(ret)
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

  render () {
    const { pageTitle } = this.props;

    return (
      <div className="header">
        <Row className="header-top">
            <Col span={22} className="title">
              <em className = "comLine"></em><span>{ pageTitle }</span>
            </Col>
            <Col span={2} className="user">
              <div className="log">
                <Icon className="logOutIco" type="poweroff" />
                <span onClick={this.logOut} className="logOut">Log Out</span>
              </div>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;
