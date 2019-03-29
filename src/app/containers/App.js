import React, { Component } from 'react';
import { Row, Col } from 'antd';

import './App.css';

import SideBar from './sidebar/sidebar';
import MHeader from './m-header/m-header';
import MBody from './m-body/m-body';

class App extends Component {
    state = {
      page: 'Protfolio'
    };

    render() {
      // const { page } = this.state;
      
      return (
        <Row type="flex">
          <Col span={4}>
            <SideBar />
          </Col>
          <Col span={20}>
            <Row>
              <Col>
                <MHeader page={this.state.page} />
              </Col>
              <Col>
                <MBody />
              </Col>
            </Row>
          </Col>
        </Row>
      );
    }
}

export default App;