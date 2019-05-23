import React, { Component } from 'react';
import { Row, Col, Button, Table } from 'antd';

import './index.less';
import Cell from './Cell';
import Validator from "./Validator";

import WithdrawForm from '../WithdrawForm';
import StakeInForm from '../StakeInForm';

import { observer, inject } from 'mobx-react';

@inject(stores => ({
  getAddrList: stores.wanAddress.getAddrList,
  stakingList: stores.staking.stakingList,
}))

@observer
class Validators extends Component {

  constructor(props) {
    super(props)
    this.state = {
      withdrawVisible: false,
      stakeInVisible: false,
    }
  }

  modifyWithdraw() {
    this.setState({ withdrawVisible: true });
  }

  modifyStakeIn() {
    this.setState({ stakeInVisible: true });
  }

  handleCancel = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  handleSend = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  columns = [
    {
      title: 'MY ACCOUNT',
      dataIndex: 'myAccount',
      key: 'myAccount',
    }, {
      title: 'MY STAKE',
      dataIndex: 'myStake',
      key: 'myStake',
      render: stake => (
        <Cell title={stake.title} bottom={stake.bottom} />
      ),
    }, {
      title: '',
      dataIndex: 'arrow1',
      key: 'arrow1',
      render: img => (
        <img className="table-arrow" src={img} />
      ),
    }, {
      title: 'VALIDATOR',
      dataIndex: 'validator',
      key: 'validator',
      render: validator => (
        <Validator img={validator.img} name={validator.name} />
      ),
    }, {
      title: '',
      dataIndex: 'arrow2',
      key: 'arrow2',
      render: img => (
        <img className="table-arrow" src={img} />
      ),
    }, {
      title: 'DISTRIBUTED REWARDS',
      dataIndex: 'distributeRewards',
      key: 'distributeRewards',
      render: stake => (
        <Cell title={stake.title} bottom={stake.bottom} />
      ),
    }, {
      title: 'MODIFY STAKE',
      dataIndex: 'modifyStake',
      key: 'modifyStake',
      render: img => (
        <div>
          <Row>
            <Col span={12} align="center"><Button className="modifyTopUpBtn" onClick={this.modifyStakeIn.bind(this)}/></Col>
            <Col span={12} align="center"><Button className="modifyExititBtn" onClick={this.modifyWithdraw.bind(this)} /></Col>
          </Row>
          <Row>
            <Col span={12} className="modifyBtnText" align="center">Top-up</Col>
            <Col span={12} className="modifyBtnText" align="center">Exitit</Col>
          </Row>
        </div>
      ),
    }
  ]

  render() {
    return (
      <div className="validators">
        <Table columns={this.columns} dataSource={this.props.stakingList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
        {this.state.withdrawVisible
          ? <WithdrawForm onCancel={this.handleCancel} onSend={this.handleSend} />
          : ''
        }

        {this.state.stakeInVisible
          ? <StakeInForm onCancel={this.handleCancel} onSend={this.handleSend} />
          : ''
        }
      </div>
    );
  }
}

export default Validators