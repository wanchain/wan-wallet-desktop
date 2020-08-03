import { Table, Row, Col } from 'antd';
import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import style from './index.less';
import OsmDelegateClaim from './OsmDelegateClaim'
import DelegateAppendAndExit from './DelegateAppendAndExit';

@inject(stores => ({
  language: stores.languageIntl.language,
  stakingList: stores.staking.stakingList,
  osmDelegateListColumns: stores.languageIntl.osmDelegateListColumns,
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
      },
      {
        ...osmDelegateListColumns[5],
        render: (text, record) =>
        <div>
          <Row>
            <Col span={8} align="center"><DelegateAppendAndExit record={record} modifyType='top-up' /></Col>
            <Col span={8} align="center"><DelegateAppendAndExit record={record} modifyType='exit' /></Col>
            <Col span={8} align="center"><OsmDelegateClaim record={record} /></Col>
          </Row>
          <Row>
            <Col span={8} className={style.modifyBtnText} align="center">Top-up</Col>
            <Col span={8} className={style.modifyBtnText} align="center">Exit</Col>
            <Col span={8} className={style.modifyBtnText} align="center">Claim</Col>
          </Row>
        </div>
      }
    ];
  }

  render() {
    const fakeData = [
      {
        key: 1,
        account: 'Account1',
        myAddress: {
          addr: '0x56664f3B65Cc5DAF4098ed10b66C4a86e58e21a4',
          type: 'normal',
          path: "m/44'/5718350'/0'/0",
        },
        stake: '213122.2222424',
        groupId: '112',
        storeman: '13',
        reward: '55',
        incentive: '14235',
        crosschain: 'Wanchain <-> Ethereum',
        wAddr: '0x56664f3B65Cc5DAF4098ed10b66C4a86e58e21a4',
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
