import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './index.less';

@inject(stores => ({
  pageTitle: stores.session.pageTitle
}))

@observer
class MHeader extends Component {
  render () {
    const { pageTitle } = this.props;

    return (
      <div className="header">
        <Row className="header-top">
            <Col span={6} className="title">
              <em className = "comLine"></em><span>{ pageTitle }</span>
            </Col>
            <Col span={18} className="user">
              <Button type="primary">Log Out</Button>
            </Col>
        </Row>
      </div>
    );
  }
}

export default MHeader;
