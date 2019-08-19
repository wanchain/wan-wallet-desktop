import { Row, Col, Table } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import './index.less';
import ValidatorIn from './ValidatorIn';
import ValidatorModify from './ValidatorModify';
import Cell from 'components/Staking/Validators/Cell';
import Validator from 'components/Staking/Validators/Validator';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  myValidatorList: stores.staking.myValidatorList,
  myValidatorColumns: stores.languageIntl.myValidatorColumns,
  getValidatorsInfo: () => stores.staking.getValidatorsInfo()
}))

@observer
class MyValidatorsList extends Component {
  state = {
    withdrawVisible: false,
    stakeInVisible: false,
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      this.props.getValidatorsInfo()
    }, 3000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
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

  getColumns () {
    const { myValidatorColumns } = this.props;
    return [
      {
        ...myValidatorColumns[0]
      },
      {
        ...myValidatorColumns[1],
        render: principal => <Cell title={formatNum(Number(principal.value).toFixed(0))} bottom={intl.get('staking.fromDaysAgo1') + principal.days + intl.get('staking.fromDaysAgo2')} />,
      },
      {
        ...myValidatorColumns[2],
        render: entrustment => <Cell title={formatNum(Number(entrustment.value).toFixed(0))} />,
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
        render: distributeRewards => <Cell title={formatNum(Number(distributeRewards.value).toFixed(2))} />,
      },
      {
        ...myValidatorColumns[7],
        render: (text, record) =>
          <div>
            <Row>
              <Col span={8} align="center"><ValidatorIn record={record} /></Col>
              <Col span={8} align="center"><ValidatorModify record={record} modifyType={record.modifyStake[1]}/></Col>
              <Col span={8} align="center"><ValidatorModify record={record} modifyType={record.modifyStake[2]}/></Col>
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

  render () {
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.myValidatorList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default MyValidatorsList;
