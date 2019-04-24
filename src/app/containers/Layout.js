import React, { Component } from 'react';
import { Row, Col } from 'antd';
import { observer, inject } from 'mobx-react';

import './Layout.less';
import SideBar from './Sidebar';
import CreateMnemonic from './CreateMnemonic';
import MHeader from 'components/MHeader';
import MFooter from 'components/MFooter';

import { accumulator } from 'utils/support';
import { getBalance } from 'utils/helper';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  hasMnemonicOrNot: stores.session.hasMnemonicOrNot,
  updateWANBalance: newBalanceArr => stores.wanAddress.updateBalance(newBalanceArr)
}))

@observer
export default class Layout extends Component {
  componentWillMount() {
    this.updateWANBalanceForInter();
  }

  componentDidMount() {
    this.wantimer = setInterval(() => this.updateWANBalanceForInter(), 5000)
  }

  componentWillUnmount() {
    clearInterval(this.wantimer);
  }

  updateWANBalanceForInter = () => {
    const promises = Object.keys(this.props.addrInfo).map(item => () => getBalance(item));
    const series = promises.reduce(accumulator, Promise.resolve([]));

    series.then(res => {
      if(res.length) {
        this.props.updateWANBalance(res);
      }
    }).catch(err => {
      console.log(err);
    });
  }

  render() {
    const { hasMnemonicOrNot } = this.props;
    
    if (!hasMnemonicOrNot) {
      return <CreateMnemonic />;
    }

    return (
      <Row className="container">
        <Col span={4} className="nav-left">
          <SideBar />
        </Col>
        <Col span={20} className="main">
          <MHeader />
          <Row className="content">
              {this.props.children}
          </Row>
          <MFooter />
        </Col>
      </Row>
    );
  }
}