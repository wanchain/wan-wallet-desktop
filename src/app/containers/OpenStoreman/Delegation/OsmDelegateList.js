import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col } from 'antd';

import style from './index.less';
import OsmDelegateOut from './OsmDelegateOut';
import OsmDelegateClaim from './OsmDelegateClaim'
import Cell from 'components/Staking/Common/Cell';
import Validator from 'components/Staking/Common/Validator';

@inject(stores => ({
  language: stores.languageIntl.language,
  osmDelegateListColumns: stores.languageIntl.osmDelegateListColumns,
  stakingList: stores.staking.stakingList,
}))

@observer
class OsmDelegateList extends Component {
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
    const { osmDelegateListColumns } = this.props;
    return [
      {
        ...osmDelegateListColumns[0]
      },
      {
        ...osmDelegateListColumns[1],
      },
      {
        ...osmDelegateListColumns[2],
      },
      {
        ...osmDelegateListColumns[3],
      },
      {
        ...osmDelegateListColumns[4],
        render: (text, record) =>
        <div>
          <Row>
            <Col span={8} align="center"><OsmDelegateOut record={record} modifyType={record.modifyStake[1]}/></Col>
            <Col span={8} align="center"><OsmDelegateClaim record={record} /></Col>
          </Row>
          <Row>
            <Col span={8} className={style.modifyBtnText} align="center">delegateOut</Col>
            <Col span={8} className={style.modifyBtnText} align="center">delegateClaim</Col>
          </Row>
        </div>
      }
    ];
  }

  render() {
    const fakeData = [
      {
        key: 1,
        myAccount: 'Test',
        deposit: '213122.2222424',
        validator: '13',
        reward: '55%',
        modifyStake: ['delegateOut', 'delegateClaim']
      }
    ]
    return (
      <div>
        <Table columns={this.getColumns()} dataSource={fakeData} pagination={{ pageSize: 5, hideOnSinglePage: true }} />
      </div>
    );
  }
}

export default OsmDelegateList;
