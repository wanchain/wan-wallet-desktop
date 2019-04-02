import React, { Component } from 'react';
import { Row, Col } from 'antd';

import './App.css';

import SideBar from './sidebar/sidebar';
import MHeader from 'components/m-header/m-header';

class App extends Component {
    state = {
      page: 'hello'
    };

    render() {
      const { children } = this.props;
      
      return (
        <Row type="flex">
          <Col span={4}>
            <SideBar />
          </Col>
          <Col span={20}>
            <Row>
              <Col>
                <MHeader page={this.state.page} />
                <React.Fragment>{children}</React.Fragment>
              </Col>
            </Row>
          </Col>
        </Row>
      );
    }
}

export default App;