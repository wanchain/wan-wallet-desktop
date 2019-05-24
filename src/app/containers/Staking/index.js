import React, { Component } from 'react';
import { Button, Table, Row, Col, message, Form } from 'antd';
import { observer, inject } from 'mobx-react';

import Cards from 'components/Staking/Cards';
import Validators from 'components/Staking/Validators';
import StakingHistory from 'components/Staking/StakingHistory';
import StakeInForm from 'components/Staking/StakeInForm';
const DelegateInForm = Form.create({ name: 'StakeInForm' })(StakeInForm);

import totalImg from 'static/image/wan.png';

import './index.less';

@inject(stores => ({
  getAddrList: stores.wanAddress.getAddrList,
  stakingList: stores.staking.stakingList,
  changeTitle: newTitle => stores.session.changeTitle(newTitle),
  updateStakeInfo: () => stores.staking.updateStakeInfo()
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
    this.props.updateStakeInfo();
    this.timer = setInterval(() =>{
      //console.log('time up staking info.')
      this.props.updateStakeInfo();
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
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

  delegateIn() {

  }

  delegateOut() {
    
  }

  render() {
    return (
      <div className="staking">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} alt="Wanchain" /><span className="dashboard">Dashboard</span></Col>
          <Col span={12} className="col-right">
            <Button className="newValidatorBtn" type="primary" shape="round" size="large" onClick={this.handleCreateValidator.bind(this)}>New Delegate</Button>
            {this.state.createValidator
              ? <DelegateInForm onCancel={this.handleCancel} onSend={this.handleSend} />
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