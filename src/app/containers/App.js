import React, { Component } from 'react';
import { Row, Col } from 'antd';

import './App.css';

import SideBar from './sidebar/sidebar';
import MHeader from './m-header/m-header';
import MBody from './m-body/m-body';

class App extends Component {
  
    render() {
        return (
          <Row>
            <Col span={6}>
              <SideBar />
            </Col>
            <Col span={18}>
              <MHeader />
              <MBody />
            </Col>
          </Row>
        );
    }
}

export default App;