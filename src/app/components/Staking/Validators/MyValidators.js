import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import './index.less';
import Cell from './Cell';
import Validator from './Validator';
import ValidatorIn from './ValidatorIn';
import ValidatorModify from './ValidatorModify';

@inject(stores => ({
  language: stores.languageIntl.language,
  getAddrList: stores.wanAddress.getAddrList,
  myValidatorList: stores.staking.myValidatorList,
  myValidatorColumns: stores.languageIntl.myValidatorColumns,
}))

@observer
class MyValidators extends Component {
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
    const { myValidatorColumns } = this.props;
    return [
      {
        ...myValidatorColumns[0]
      }, 
      {
        ...myValidatorColumns[1],
        render: principal => <Cell title={principal.value} bottom={intl.get('staking.fromDaysAgo1') + principal.days + intl.get('staking.fromDaysAgo2')} />,
      },
      {
        ...myValidatorColumns[2],
        render: entrustment => <Cell title={entrustment.value} bottom={entrustment.person + intl.get('ValidatorNode.table.validatorNum')} />,
      },
      {
        ...myValidatorColumns[3],
        render: img => <img className="table-arrow" src={img} />,
      },
      {
        ...myValidatorColumns[4],
        render: validator => <Validator img={validator.img} name={validator.name} title={validator.address}/>,
      },
      {
        ...myValidatorColumns[5],
        render: img => <img className="table-arrow" src={img} />,
      },
      {
        ...myValidatorColumns[6],
        render: distributeRewards => <Cell title={distributeRewards.value} bottom={distributeRewards.num + intl.get('staking.fromEpochs2')} />,
      },
      {
        ...myValidatorColumns[7],
        render: (text, record) => 
          <div>
            <Row>
              <Col span={8} align="center"><ValidatorIn record={record} /></Col>
              <Col span={8} align="center"><ValidatorModify record={record} /></Col>
              <Col span={8} align="center"><ValidatorModify record={record} /></Col>
            </Row>
            <Row>
              <Col span={8} className="modifyBtnText" align="center">{intl.get(`staking.table.${text[0]}`)}</Col>
              <Col span={8} className="modifyBtnText" align="center">{intl.get(`staking.table.${text[1]}`)}</Col>
              <Col span={8} className="modifyBtnText" align="center">{intl.get(`staking.table.${text[2]}`)}</Col>
            </Row>
          </div>
      }
    ];
  }

  render() {
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.myValidatorList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default MyValidators;