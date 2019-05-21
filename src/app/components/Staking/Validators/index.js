import React, { Component } from 'react';
import { Row, Col, Button, Table } from 'antd';
import './index.less';
import Validator from './Validator';

class Validators extends Component {

  columns = [
    {
      title: 'MY ACCOUNT',
      dataIndex: 'myAccount',
      key: 'myAccount',
    }, {
      title: 'MY STAKE',
      dataIndex: 'myStake',
      key: 'myStake',
    }, {
      title: 'VALIDATOR',
      dataIndex: 'validator',
      key: 'validator',
    }, {
      title: 'DISTRIBUTED REWARDS',
      dataIndex: 'distributeRewards',
      key: 'distributeRewards'
    }, {
      title: 'MODIFY STAKE',
      dataIndex: 'modifyStake',
      key: 'modifyStake'
    }
  ]

  render() {
    let validators = []
    for (let i = 0; i < 5; i++) {
      validators.push({myAccount: "ACCOUNT1", myStake: {title:"50,000WAN", tail:"30 days ago"}, validator:"XXXX", distributeRewards: "2000", modifyStake: ["+", "-"]})
    }

    return (
      <div className="validators">
        <Table columns={this.columns} dataSource={validators} pagination={{ pageSize: 5, hideOnSinglePage: true }}/>
      </div>
    );
  }
}

export default Validators