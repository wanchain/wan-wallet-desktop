import React, { Component } from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

class MBody extends Component {
  render () {
    return (
      <Layout>
        <Content style={{margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280}}>
          Content
        </Content>
      </Layout>
    );
  }
}

export default MBody;