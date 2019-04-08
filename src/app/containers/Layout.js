import React, { Component } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './Layout.less';
import SideBar from './Sidebar';
import CreateMnemonic from './CreateMnemonic';
import MHeader from 'components/MHeader';


@inject(stores => ({
  hasMnemonic: () => !!stores.session.hasMnemonic,
}))

@observer
export default class Layout extends Component {
    state = {
      page: 'hello'
    };

    render() {
      var { hasMnemonic } = this.props;


      if (!hasMnemonic()) {
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
          </Col>
        </Row>
      );
    }
}