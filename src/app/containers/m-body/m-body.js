import React, { Component } from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

class MBody extends Component {
  render () {
    return (
      <Layout>
        <Content style={{padding: 24, background: '#13175C', minHeight:"90vh", color:'#fff'}}>
          Content
        </Content>
      </Layout>
    );
  }
}

export default MBody;