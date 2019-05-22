import React, { Component } from 'react';
import { Button, Table, Row, Col, message } from 'antd';
import { observer, inject } from 'mobx-react';

import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
import StakingHistory from 'components/Staking/StakingHistory';
import StakeInForm from 'components/Staking/StakeInForm';


import totalImg from 'static/image/wan.png';

import './index.less';

@inject(stores => ({
  addrInfo: stores.wanAddress.addrInfo,
  getAmount: stores.wanAddress.getNormalAmount,
  getAddrList: stores.wanAddress.getAddrList,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
}))

@observer
class Staking extends Component {
  constructor(props) {
    super(props);
    this.props.changeTitle('Staking');
    this.state = {
      createValidator: false,
    }
  }

  componentDidMount() {
    const { getAmount, getAddrList } = this.props;
    console.log("getAddrList", getAddrList)
    console.log('-----------')
    console.log("getAmount", getAmount)

  }

  componentWillUnmount() {
  }

  handleCreateValidator() {
    this.setState({ createValidator: true });
  }

  handleCancel = () => {
    this.setState({ createValidator: false });
  }

  handleSend = () => {
    this.setState({ createValidator: false });
  }

  render() {
    return (
      <div className="staking">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt="Wanchain" /><span className="dashboard">Dashboard</span></Col>
          <Col span={12} className="col-right">
            <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleCreateValidator.bind(this)}>New Validator</Button>
            {this.state.createValidator
              ? <StakeInForm onCancel={this.handleCancel} onSend={this.handleSend} />
              : ''
            }
          </Col>
        </Row>
        <Row>
          <Col>
            <Cards />
          </Col>
        </Row>
        <Row>
          <Col>
            <Validators />
          </Col>
        </Row>
        <Row>
          <Col>
            <StakingHistory />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Staking;