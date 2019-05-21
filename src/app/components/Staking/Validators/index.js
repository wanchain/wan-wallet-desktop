import React, { Component } from 'react';
import { Row, Col, Button, Table } from 'antd';
import './index.less';
import Cell from './Cell';
import Validator from "./Validator";
import validatorImg from 'static/image/validator.png';
import arrow from 'static/image/arrow.png';
import topup2 from 'static/image/topup2.png';

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
            <Col span={12} align="center"><Button className="modifyTopUpBtn" /></Col>
            <Col span={12} align="center"><Button className="modifyExititBtn" /></Col>
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
    let validators = []
    for (let i = 0; i < 5; i++) {
      validators.push({
        myAccount: "ACCOUNT1",
        myStake: { title: "50,000", bottom: "30 days ago" },
        arrow1: arrow,
        validator: { img: validatorImg, name: "Ethereum" },
        arrow2: arrow,
        distributeRewards: { title: "50,000", bottom: "from 50 epochs" },
        modifyStake: ["+", "-"]
      })
    }

    return (
      <div className="validators">
        <Table columns={this.columns} dataSource={validators} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default Validators