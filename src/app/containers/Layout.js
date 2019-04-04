import React, { Component } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './Layout.css';
import SideBar from './Sidebar';
import CreateMnemonic from './CreateMnemonic';
import MHeader from 'components/m-header/m-header';


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
        <Row type="flex">
          <Col span={4}>
            <SideBar />
          </Col>
          <Col span={20}>
            <Row>
              <Col>
                <MHeader page={this.state.page} />
                {this.props.children}
              </Col>
            </Row>
          </Col>
        </Row>
      );
    }
}