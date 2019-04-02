import React, { Component } from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

class Portfolio extends Component {
  render () {
    return (
      <Layout>
        <Content style={{padding: 24, background: '#13175C', minHeight:"90vh", color:'#fff'}}>
          Portfolio
        </Content>
      </Layout>
    );
  }
}

export default Portfolio;