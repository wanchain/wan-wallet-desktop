import React, { Component } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './Layout.less';
import SideBar from './Sidebar';
import CreateMnemonic from './CreateMnemonic';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';

@inject(stores => ({
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
}))

@observer
export default class Layout extends Component {
  render() {
    const { hasMnemonicOrNot } = this.props;
    console.log( hasMnemonicOrNot )
    if (!hasMnemonicOrNot) {
      return <CreateMnemonic />;
    }

    return (
      <Row className="container">
        <Col span={4} className="nav-left">
          <SideBar />
        </Col>
        <Col span={20} className="main">
          <MHeader />
          <Row className="content">
              {this.props.children}
          </Row>
          <MFooter />
        </Col>
      </Row>
    );
  }
}