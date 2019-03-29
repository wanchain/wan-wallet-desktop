import React, { Component } from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

class MHeader extends Component {
  render () {
    return (
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }}>
          Header
        </Header>
      </Layout>
    );
  }
}

export default MHeader;