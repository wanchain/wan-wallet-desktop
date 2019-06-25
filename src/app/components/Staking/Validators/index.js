import React, { Component } from 'react';
import { Row, Col, Button, Table, Form } from 'antd';

import './index.less';
import Cell from './Cell';
import { observer, inject } from 'mobx-react';

import intl from 'react-intl-universal';

import Validator from "./Validator";
import DelegateIn from "./DelegateIn";
import DelegateOut from "./DelegateOut";

@inject(stores => ({
  language: stores.languageIntl.language,
  validatorColumns: stores.languageIntl.validatorColumns,
  getAddrList: stores.wanAddress.getAddrList,
  stakingList: stores.staking.stakingList,
}))

@observer
class Validators extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
  }

  modifyWithdraw = () => {
    this.setState({ withdrawVisible: true });
  }

  handleCancel = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  handleSend = () => {
    this.setState({ withdrawVisible: false, stakeInVisible: false });
  }

  getColumns() {
    let columns = [
      {
        title: this.props.validatorColumns[0].title,
        dataIndex: 'myAccount',
        key: 'myAccount',
      }, {
        title: this.props.validatorColumns[1].title,
        dataIndex: 'myStake',
        key: 'myStake',
        render: stake => (
          <Cell title={stake.title} bottom={intl.get('staking.fromDaysAgo1') + stake.bottom + intl.get('staking.fromDaysAgo2')} />
        ),
      }, {
        title: this.props.validatorColumns[2].title,
        dataIndex: 'arrow1',
        key: 'arrow1',
        render: img => (
          <img className="table-arrow" src={img} />
        ),
      }, {
        title: this.props.validatorColumns[3].title,
        dataIndex: 'validator',
        key: 'validator',
        render: validator => (
          <Validator img={validator.img} name={validator.name} title={validator.address}/>
        ),
      }, {
        title: this.props.validatorColumns[4].title,
        dataIndex: 'arrow2',
        key: 'arrow2',
        render: img => (
          <img className="table-arrow" src={img} />
        ),
      }, {
        title: this.props.validatorColumns[5].title,
        dataIndex: 'distributeRewards',
        key: 'distributeRewards',
        render: stake => (
          <Cell title={stake.title} bottom={intl.get('staking.fromEpochs1') + stake.bottom + intl.get('staking.fromEpochs2')} />
        ),
      }, {
        title: this.props.validatorColumns[6].title,
        dataIndex: 'modifyStake',
        key: 'modifyStake',
        render: (text, record) => {
          return (
            <div>
              <Row>
                <Col span={6} align="left"><DelegateIn record={record} /></Col>
                <Col span={6} align="center"><DelegateOut record={record} /></Col>
              </Row>
              <Row>
                <Col span={6} className="modifyBtnText" align="left">{intl.get('staking.table.topup')}</Col>
                <Col span={6} className="modifyBtnText" align="center">{intl.get('staking.table.exit')}</Col>
              </Row>
            </div>
          )
        }
      }
    ]

    return columns
  }

  render() {
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.stakingList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default Validators