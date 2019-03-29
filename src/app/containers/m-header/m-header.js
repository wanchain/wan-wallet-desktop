import React, { Component } from 'react';
import { Layout } from 'antd';

const { Header } = Layout;

class MHeader extends Component {
  constructor(props) {
    super(props);
  }

  render () {
    const page = this.props.page;

    return (
      <Layout style={{}}>
        <Header style={{ background: '#131740', padding: 0, minHeight:"10vh", color:'#fff'}}>
          {page}
        </Header>
      </Layout>
    );
  }
}

export default MHeader;