import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table } from 'antd';

import './index.less';
import Cell from './Cell';
import Validator from './Validator';
import DelegateActionGroup from './DelegateActionGroup';
import { formatNum } from 'utils/support';

@inject(stores => ({
  language: stores.languageIntl.language,
  validatorColumns: stores.languageIntl.validatorColumns,
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

  getColumns () {
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
          <Cell title={formatNum(stake.title)} bottom={intl.get('staking.fromDaysAgo1') + stake.bottom + intl.get('staking.fromDaysAgo2')} />
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
          <Cell title={formatNum(stake.title)} />
        ),
      }, {
        title: this.props.validatorColumns[6].title,
        dataIndex: 'modifyStake',
        key: 'modifyStake',
        align: 'center',
        render: (text, record) => {
          return (
            <DelegateActionGroup record={record}/>
          )
        }
      }
    ]

    return columns
  }

  render () {
    return (
      <div className="validators">
        <Table columns={this.getColumns()} dataSource={this.props.stakingList} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default Validators;
